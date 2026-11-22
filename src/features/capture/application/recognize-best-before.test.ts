import { describe, expect, it } from 'vitest'
import { createFakeVisionRecognizer, type FakeAnswer } from '@/server/ai/fake-vision-recognizer'
import type { AiImage } from '@/server/ai/vision-recognizer'
import { AI_ROLE_DEFAULT_MODELS } from '@/shared/config/ai-roles'
import { recognizeBestBefore } from './recognize-best-before'

const image: AiImage = { data: new Uint8Array([1, 2, 3]), mimeType: 'image/jpeg' }
const models = {
  first: AI_ROLE_DEFAULT_MODELS.mhd,
  second: AI_ROLE_DEFAULT_MODELS.mhd_zweitversuch,
}

const read = (datum: string | null, sicherheit: 'hoch' | 'mittel' | 'niedrig') => ({
  roh_text: datum,
  datum,
  genauigkeit: 'tag',
  art: 'mhd',
  sicherheit,
})

async function run(answers: FakeAnswer[]) {
  const recognizer = createFakeVisionRecognizer(answers)
  const result = await recognizeBestBefore({ recognizer, image, models })
  return { result, requests: recognizer.requests }
}

describe('recognizeBestBefore', () => {
  it('bleibt bei einem sicheren Datum beim ersten Versuch mit Haiku', async () => {
    const { result, requests } = await run([{ role: 'mhd', answer: read('2027-09-30', 'hoch') }])

    expect(result.answer).toEqual({ ok: true, value: read('2027-09-30', 'hoch') })
    expect(requests.map((request) => [request.role, request.model])).toEqual([
      ['mhd', 'claude-haiku-5-5'],
    ])
    expect(result.calls).toHaveLength(1)
  })

  it('versucht es bei niedriger Sicherheit mit Sonnet erneut und nimmt das sicherere', async () => {
    const { result, requests } = await run([
      { role: 'mhd', answer: read('2027-09-30', 'niedrig') },
      { role: 'mhd_zweitversuch', answer: read('2027-08-31', 'hoch') },
    ])

    expect(result.answer).toEqual({ ok: true, value: read('2027-08-31', 'hoch') })
    expect(requests.map((request) => [request.role, request.model])).toEqual([
      ['mhd', 'claude-haiku-5-5'],
      ['mhd_zweitversuch', 'claude-sonnet-5-5'],
    ])
  })

  it('versucht es ohne Datum erneut und bleibt leer, wenn auch der Zweitversuch nichts liest', async () => {
    const { result } = await run([])

    expect(result.answer).toMatchObject({ ok: true, value: { datum: null } })
    expect(result.calls.map((call) => call.role)).toEqual(['mhd', 'mhd_zweitversuch'])
  })

  it('gibt beide Aufrufe fürs Protokoll zurück, auch einen gescheiterten Zweitversuch', async () => {
    const { result } = await run([
      { role: 'mhd', answer: read('2027-09-30', 'niedrig') },
      { role: 'mhd_zweitversuch', failure: { kind: 'rate-limited' } },
    ])

    expect(result.answer).toEqual({ ok: true, value: read('2027-09-30', 'niedrig') })
    expect(result.calls).toEqual([
      expect.objectContaining({ role: 'mhd', inputTokens: 0 }),
      expect.objectContaining({ role: 'mhd_zweitversuch', inputTokens: null }),
    ])
  })

  it('startet nach einem Fehler im ersten Versuch keinen Zweitversuch', async () => {
    const { result, requests } = await run([{ role: 'mhd', failure: { kind: 'timeout' } }])

    expect(result.answer).toEqual({ ok: false, error: { kind: 'timeout' } })
    expect(requests).toHaveLength(1)
  })
})
