import { describe, expect, it } from 'vitest'
import { createFakeAnthropicApi, messageReply } from '../../../tests/helpers/fake-anthropic-api'
import { SecretValue } from '../crypto/secret-value'
import { createAnthropicAdapter } from './anthropic-adapter'
import { createConcurrencyLimit } from './concurrency-limit'
import type { AiImage } from './vision-recognizer'

// Erfundener Testschlüssel, kein echter.
const API_KEY = 'sk-ant-test-schluessel-4f2a'
const IMAGE: AiImage = { data: new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), mimeType: 'image/jpeg' }
const BEST_BEFORE = {
  roh_text: '31.08.2027',
  datum: '2027-08-31',
  genauigkeit: 'tag',
  art: 'mhd',
  sicherheit: 'hoch',
}

function adapterWith(replies: Parameters<typeof createFakeAnthropicApi>[0]) {
  const api = createFakeAnthropicApi(replies)
  const adapter = createAnthropicAdapter({
    apiKey: new SecretValue(API_KEY),
    baseUrl: null,
    limit: createConcurrencyLimit(2),
    fetch: api.fetch,
    sleep: () => Promise.resolve(),
  })
  return { adapter, requests: api.requests }
}

const recognizeBestBefore = (adapter: ReturnType<typeof adapterWith>['adapter']) =>
  adapter.recognize({ role: 'mhd', image: IMAGE, model: 'claude-haiku-5-5', context: {} })

describe('Anthropic-Adapter: Anfrage', () => {
  it('schickt Modell, Foto vor dem Text und das Schema als Structured Output', async () => {
    const { adapter, requests } = adapterWith([messageReply(BEST_BEFORE)])

    await recognizeBestBefore(adapter)

    const [request] = requests
    expect(request?.url).toBe('https://api.anthropic.com/v1/messages')
    expect(request?.body).toMatchObject({
      model: 'claude-haiku-5-5',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: '/9j/4A==' },
            },
            { type: 'text' },
          ],
        },
      ],
      output_config: { format: { type: 'json_schema' } },
    })
  })

  it('entfernt $schema aus dem JSON-Schema', async () => {
    const { adapter, requests } = adapterWith([messageReply(BEST_BEFORE)])

    await recognizeBestBefore(adapter)

    const format = (requests[0]?.body['output_config'] as { format: { schema: object } }).format
    expect(format.schema).not.toHaveProperty('$schema')
    expect(format.schema).toMatchObject({ type: 'object', additionalProperties: false })
  })

  it('verbietet im MHD-Prompt erfundene Daten', async () => {
    const { adapter, requests } = adapterWith([messageReply(BEST_BEFORE)])

    await recognizeBestBefore(adapter)

    expect(requests[0]?.body['system']).toContain('ERFINDE NIEMALS EIN DATUM')
    expect(requests[0]?.body['system']).toContain('erfinde nichts')
  })

  it('nennt der Verpackung die erlaubten Lebensmittelarten', async () => {
    const { adapter, requests } = adapterWith([messageReply({})])
    const context = { foodTypes: [{ key: 'spaghetti', name: 'Spaghetti' }] }

    await adapter.recognize({ role: 'verpackung', image: IMAGE, model: 'm', context })

    expect(JSON.stringify(requests[0]?.body['messages'])).toContain('spaghetti: Spaghetti')
  })

  it('sendet den Schlüssel nur im Header, nie im Body', async () => {
    const { adapter, requests } = adapterWith([messageReply(BEST_BEFORE)])

    await recognizeBestBefore(adapter)

    // SDK 1.12 schickt den Schlüssel als Bearer-Token im Authorization-Header.
    expect(requests[0]?.headers.get('authorization')).toBe(`Bearer ${API_KEY}`)
    expect(JSON.stringify(requests[0]?.body)).not.toContain(API_KEY)
  })
})

describe('Anthropic-Adapter: Antwort', () => {
  it('liefert die geprüfte Antwort samt Tokens für das Protokoll', async () => {
    const { adapter } = adapterWith([messageReply(BEST_BEFORE)])

    const outcome = await recognizeBestBefore(adapter)

    expect(outcome.answer).toEqual({ ok: true, value: BEST_BEFORE })
    expect(outcome.call).toMatchObject({
      role: 'mhd',
      model: 'claude-haiku-5-5',
      inputTokens: 1200,
      outputTokens: 80,
    })
  })

  it('meldet einen Schema-Verstoß als invalid-response', async () => {
    const { adapter } = adapterWith([messageReply({ ...BEST_BEFORE, sicherheit: 'sehr hoch' })])

    const outcome = await recognizeBestBefore(adapter)

    expect(outcome.answer).toMatchObject({ ok: false, error: { kind: 'invalid-response' } })
  })

  it('meldet kein gültiges JSON als invalid-response', async () => {
    const { adapter } = adapterWith([messageReply('Das Datum ist der 31.08.')])

    expect((await recognizeBestBefore(adapter)).answer).toMatchObject({
      ok: false,
      error: { kind: 'invalid-response', issues: 'Antwort ist kein gültiges JSON' },
    })
  })

  it.each([
    ['refusal', 'abgelehnt'],
    ['max_tokens', 'abgeschnitten'],
  ])('verwirft eine Antwort mit stop_reason %s', async (stopReason, issue) => {
    const { adapter } = adapterWith([messageReply(BEST_BEFORE, { stop_reason: stopReason })])

    const outcome = await recognizeBestBefore(adapter)

    expect(outcome.answer).toMatchObject({ ok: false, error: { kind: 'invalid-response' } })
    expect(JSON.stringify(outcome.answer)).toContain(issue)
  })

  it('besteht den Verbindungstest mit einer kurzen Anfrage ohne Foto', async () => {
    const { adapter, requests } = adapterWith([messageReply('OK')])

    expect(await adapter.testConnection('claude-haiku-5-5')).toEqual({ ok: true, value: null })
    expect(requests[0]?.body).toMatchObject({ model: 'claude-haiku-5-5', max_tokens: 16 })
    expect(JSON.stringify(requests[0]?.body)).not.toContain('image')
  })
})
