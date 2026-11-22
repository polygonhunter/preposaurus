import { describe, expect, it } from 'vitest'
import {
  createFakeAnthropicApi,
  errorReply,
  messageReply,
} from '../../../tests/helpers/fake-anthropic-api'
import { SecretValue } from '../crypto/secret-value'
import { createAnthropicAdapter } from './anthropic-adapter'
import { createConcurrencyLimit } from './concurrency-limit'
import type { AiImage } from './vision-recognizer'

const IMAGE: AiImage = { data: new Uint8Array([1, 2, 3]), mimeType: 'image/jpeg' }
const BEST_BEFORE = {
  roh_text: '08/2027',
  datum: '2027-08-31',
  genauigkeit: 'monat',
  art: 'mhd',
  sicherheit: 'mittel',
}

type Replies = Parameters<typeof createFakeAnthropicApi>[0]

function adapterWith(replies: Replies, options: { totalTimeoutMs?: number } = {}) {
  const api = createFakeAnthropicApi(replies)
  // Die Pause vor der Wiederholung bleibt offen, bis der Test sie beendet.
  const started = Promise.withResolvers<null>()
  const finished = Promise.withResolvers<null>()
  const sleep = async () => {
    started.resolve(null)
    await finished.promise
  }
  const adapter = createAnthropicAdapter({
    apiKey: new SecretValue('sk-ant-test'),
    baseUrl: null,
    limit: createConcurrencyLimit(1),
    fetch: api.fetch,
    sleep,
    ...options,
  })
  const recognize = (model = 'claude-haiku-5-5') =>
    adapter.recognize({ role: 'mhd', image: IMAGE, model, context: {} })
  const finishSleep = () => {
    finished.resolve(null)
  }
  return { recognize, requests: api.requests, sleepStarted: started.promise, finishSleep }
}

describe('Anthropic-Adapter: Grenzen', () => {
  it('belegt während der Pause vor der Wiederholung keinen Platz der Parallel-Grenze', async () => {
    const replies = [
      errorReply(429, 'rate_limit_error', { 'retry-after': '1' }),
      messageReply(BEST_BEFORE),
      messageReply(BEST_BEFORE),
    ]
    const setup = adapterWith(replies)

    const first = setup.recognize()
    await setup.sleepStarted
    // Grenze 1: Läuft der zweite Aufruf jetzt durch, hält die Pause keinen Platz.
    const second = await setup.recognize()
    setup.finishSleep()

    expect(second.answer.ok).toBe(true)
    expect((await first).answer.ok).toBe(true)
    expect(setup.requests).toHaveLength(3)
  })

  it('wiederholt nicht, wenn die Pause das Gesamt-Zeitlimit sprengen würde', async () => {
    const replies = [errorReply(429, 'rate_limit_error', { 'retry-after': '3' })]
    const { recognize, requests } = adapterWith(replies, { totalTimeoutMs: 2_500 })

    expect((await recognize()).answer).toEqual({ ok: false, error: { kind: 'rate-limited' } })
    expect(requests).toHaveLength(1)
  })

  it('schreibt Enum-Werte klein, bevor die Antwort geprüft wird', async () => {
    const { recognize } = adapterWith([
      messageReply({ ...BEST_BEFORE, sicherheit: 'Niedrig', genauigkeit: 'Monat' }),
    ])

    expect((await recognize()).answer).toEqual({
      ok: true,
      value: { ...BEST_BEFORE, sicherheit: 'niedrig', genauigkeit: 'monat' },
    })
  })
})

describe('Anthropic-Adapter: Denken und Effort je Modell', () => {
  it('schaltet bei Haiku 5.5 das Denken aus und setzt keinen Effort', async () => {
    const { recognize, requests } = adapterWith([messageReply(BEST_BEFORE)])

    await recognize('claude-haiku-5-5')

    expect(requests[0]?.body['thinking']).toEqual({ type: 'disabled' })
    expect(requests[0]?.body['output_config']).not.toHaveProperty('effort')
    expect(requests[0]?.body['max_tokens']).toBe(16_000)
  })

  it('lässt Sonnet 5.5 adaptiv denken, mit Effort medium', async () => {
    const { recognize, requests } = adapterWith([messageReply(BEST_BEFORE)])

    await recognize('claude-sonnet-5-5')

    expect(requests[0]?.body).not.toHaveProperty('thinking')
    expect(requests[0]?.body['output_config']).toMatchObject({ effort: 'medium' })
  })

  it('lässt unbekannte Modelle bei ihren Standardwerten', async () => {
    const { recognize, requests } = adapterWith([messageReply(BEST_BEFORE)])

    await recognize('claude-opus-5-5')

    expect(requests[0]?.body).not.toHaveProperty('thinking')
    expect(requests[0]?.body['output_config']).not.toHaveProperty('effort')
  })
})
