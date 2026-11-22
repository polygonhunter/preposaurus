import { describe, expect, it, vi } from 'vitest'
import {
  createFakeAnthropicApi,
  errorReply,
  hangingReply,
  messageReply,
} from '../../../tests/helpers/fake-anthropic-api'
import { SecretValue } from '../crypto/secret-value'
import { createAnthropicAdapter } from './anthropic-adapter'
import { createConcurrencyLimit } from './concurrency-limit'
import type { AiImage } from './vision-recognizer'

// Erfundener Testschlüssel, kein echter.
const API_KEY = 'sk-ant-test-schluessel-4f2a'
const IMAGE: AiImage = { data: new Uint8Array([1, 2, 3]), mimeType: 'image/jpeg' }
const BEST_BEFORE = {
  roh_text: null,
  datum: null,
  genauigkeit: 'unbekannt',
  art: 'unbekannt',
  sicherheit: 'niedrig',
}

function setup(replies: Parameters<typeof createFakeAnthropicApi>[0], timeoutMs = 5_000) {
  const api = createFakeAnthropicApi(replies)
  const sleep = vi.fn(() => Promise.resolve())
  const adapter = createAnthropicAdapter({
    apiKey: new SecretValue(API_KEY),
    baseUrl: null,
    limit: createConcurrencyLimit(2),
    timeoutMs,
    fetch: api.fetch,
    sleep,
  })
  const recognize = () =>
    adapter.recognize({ role: 'mhd', image: IMAGE, model: 'claude-haiku-5-5', context: {} })
  return { adapter, recognize, requests: api.requests, sleep }
}

describe('Anthropic-Adapter: Fehlerarten', () => {
  it.each([
    [401, 'authentication_error', 'invalid-key'],
    [403, 'permission_error', 'invalid-key'],
    [402, 'billing_error', 'no-credit'],
    [400, 'invalid_request_error', 'provider-error'],
    [404, 'not_found_error', 'provider-error'],
  ])('bildet %i (%s) auf %s ab, ohne zu wiederholen', async (status, type, kind) => {
    const { recognize, requests } = setup([errorReply(status, type)])

    const outcome = await recognize()

    expect(outcome.answer).toEqual({ ok: false, error: { kind } })
    expect(outcome.call).toMatchObject({ inputTokens: null, outputTokens: null })
    expect(requests).toHaveLength(1)
  })

  it('bricht nach dem Zeitlimit ab und wiederholt eine Zeitüberschreitung nicht', async () => {
    const { recognize, requests } = setup([hangingReply], 50)

    const outcome = await recognize()

    expect(outcome.answer).toEqual({ ok: false, error: { kind: 'timeout' } })
    expect(requests).toHaveLength(1)
  })

  it('meldet 504 nach einer Wiederholung als Zeitüberschreitung', async () => {
    const { recognize, requests } = setup([errorReply(504, 'timeout_error')])

    expect((await recognize()).answer).toEqual({ ok: false, error: { kind: 'timeout' } })
    expect(requests).toHaveLength(2)
  })

  it('verrät den Schlüssel in keiner Rückgabe', async () => {
    const { recognize } = setup([errorReply(401, 'authentication_error')])

    expect(JSON.stringify(await recognize())).not.toContain(API_KEY)
  })
})

describe('Anthropic-Adapter: Wiederholung', () => {
  it('wiederholt 429 genau einmal und wartet so lange, wie retry-after sagt', async () => {
    const replies = [errorReply(429, 'rate_limit_error', { 'retry-after': '2' })]
    const { recognize, requests, sleep } = setup([...replies, messageReply(BEST_BEFORE)])

    const outcome = await recognize()

    expect(outcome.answer.ok).toBe(true)
    expect(requests).toHaveLength(2)
    expect(sleep).toHaveBeenCalledWith(2_000)
  })

  it('begrenzt die Wartezeit auf 5 Sekunden', async () => {
    const replies = [errorReply(429, 'rate_limit_error', { 'retry-after': '120' })]
    const { recognize, sleep } = setup([...replies, messageReply(BEST_BEFORE)])

    await recognize()

    expect(sleep).toHaveBeenCalledWith(5_000)
  })

  it('meldet rate-limited, wenn auch die Wiederholung an 429 scheitert', async () => {
    const { recognize, requests } = setup([errorReply(429, 'rate_limit_error')])

    expect((await recognize()).answer).toEqual({ ok: false, error: { kind: 'rate-limited' } })
    expect(requests).toHaveLength(2)
  })

  it.each([500, 529])('wiederholt %i einmal und meldet dann provider-error', async (status) => {
    const { recognize, requests } = setup([errorReply(status, 'api_error')])

    expect((await recognize()).answer).toEqual({ ok: false, error: { kind: 'provider-error' } })
    expect(requests).toHaveLength(2)
  })

  it('übersteht einen einzelnen 529 mit der Wiederholung', async () => {
    const { recognize } = setup([errorReply(529, 'overloaded_error'), messageReply(BEST_BEFORE)])

    expect((await recognize()).answer).toEqual({ ok: true, value: BEST_BEFORE })
  })

  it('bildet Fehler auch beim Verbindungstest ab', async () => {
    const { adapter } = setup([errorReply(402, 'billing_error')])

    expect(await adapter.testConnection('claude-haiku-5-5')).toEqual({
      ok: false,
      error: { kind: 'no-credit' },
    })
  })
})
