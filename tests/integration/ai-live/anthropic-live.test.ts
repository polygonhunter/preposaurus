// Echte Aufrufe bei Anthropic, nur wenn ANTHROPIC_API_KEY in der Shell gesetzt ist. In der CI und
// im Pre-Push gibt es keinen Schlüssel, dort ist der Test übersprungen (UMSETZUNG Grundentscheidung
// 12). Kostet je Lauf Bruchteile eines Cents (Haiku 5.5, ein kleines Bild).
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { createAnthropicAdapter } from '../../../src/server/ai/anthropic-adapter'
import { createConcurrencyLimit } from '../../../src/server/ai/concurrency-limit'
import { SecretValue } from '../../../src/server/crypto/secret-value'
import { AI_ROLE_DEFAULT_MODELS } from '../../../src/shared/config/ai-roles'

// eslint-disable-next-line no-restricted-properties -- Werkzeug, nicht App: der Test entscheidet selbst, ob er echt aufruft
const apiKey = process.env['ANTHROPIC_API_KEY']?.trim()

describe.skipIf(apiKey === undefined || apiKey === '')(
  'Anthropic-Adapter gegen die echte API',
  () => {
    const adapter = createAnthropicAdapter({
      apiKey: new SecretValue(apiKey ?? ''),
      baseUrl: null,
      limit: createConcurrencyLimit(1),
    })

    it('besteht den Verbindungstest', async () => {
      expect(await adapter.testConnection(AI_ROLE_DEFAULT_MODELS.mhd)).toEqual({
        ok: true,
        value: null,
      })
    })

    it('liest auf einem leeren Bild kein Datum und erfindet keins', async () => {
      const blank = { width: 400, height: 200, channels: 3, background: '#ffffff' } as const
      const data = await sharp({ create: blank }).jpeg().toBuffer()

      const outcome = await adapter.recognize({
        role: 'mhd',
        image: { data: new Uint8Array(data), mimeType: 'image/jpeg' },
        model: AI_ROLE_DEFAULT_MODELS.mhd,
        context: {},
      })

      expect(outcome.answer).toMatchObject({ ok: true, value: { datum: null } })
      expect(outcome.call.inputTokens).toBeGreaterThan(0)
    })
  },
)
