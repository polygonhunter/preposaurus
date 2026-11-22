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

const SCHEMA_VIOLATION = { ...read('2027-09-30', 'hoch'), sicherheit: 'ganz sicher' }

async function run(answers: FakeAnswer[], second: string | null = models.second) {
  const recognizer = createFakeVisionRecognizer(answers)
  const result = await recognizeBestBefore({ recognizer, image, models: { ...models, second } })
  const roles = recognizer.requests.map((request) => [request.role, request.model])
  return { ...result, roles }
}

describe('recognizeBestBefore', () => {
  it('bleibt bei einem sicheren Datum beim ersten Versuch mit Haiku', async () => {
    const { result, roles, calls } = await run([
      { role: 'mhd', answer: read('2027-09-30', 'hoch') },
    ])

    expect(result).toEqual({
      ok: true,
      value: { answer: read('2027-09-30', 'hoch'), conflictingDate: null },
    })
    expect(roles).toEqual([['mhd', 'claude-haiku-5-5']])
    expect(calls).toHaveLength(1)
  })

  it('versucht es bei niedriger Sicherheit mit Sonnet und markiert einen Widerspruch', async () => {
    const { result, roles } = await run([
      { role: 'mhd', answer: read('2027-09-30', 'niedrig') },
      { role: 'mhd_zweitversuch', answer: read('2027-08-31', 'hoch') },
    ])

    expect(result).toEqual({
      ok: true,
      value: { answer: read('2027-08-31', 'niedrig'), conflictingDate: '2027-09-30' },
    })
    expect(roles).toEqual([
      ['mhd', 'claude-haiku-5-5'],
      ['mhd_zweitversuch', 'claude-sonnet-5-5'],
    ])
  })

  it('nimmt Versuch 2, wenn Versuch 1 kein Datum hat', async () => {
    const { result } = await run([
      { role: 'mhd', answer: read(null, 'mittel') },
      { role: 'mhd_zweitversuch', answer: read('2027-08-31', 'hoch') },
    ])

    expect(result).toEqual({
      ok: true,
      value: { answer: read('2027-08-31', 'hoch'), conflictingDate: null },
    })
  })

  it('versucht es bei einem ungültigen Datum in Versuch 1 erneut', async () => {
    const { result, roles } = await run([
      { role: 'mhd', answer: read('2027-02-30', 'hoch') },
      { role: 'mhd_zweitversuch', answer: read('2027-02-28', 'hoch') },
    ])

    expect(roles.map(([role]) => role)).toEqual(['mhd', 'mhd_zweitversuch'])
    expect(result).toMatchObject({ ok: true, value: { answer: { datum: '2027-02-28' } } })
  })

  it('bleibt leer, wenn auch der Zweitversuch nichts liest', async () => {
    const { result, calls } = await run([])

    expect(result).toMatchObject({ ok: true, value: { answer: { datum: null } } })
    expect(calls.map((call) => call.role)).toEqual(['mhd', 'mhd_zweitversuch'])
  })

  it('startet keinen Zweitversuch, wenn die Rolle nicht aktiv ist', async () => {
    const { result, roles } = await run([{ role: 'mhd', answer: read(null, 'niedrig') }], null)

    expect(roles).toEqual([['mhd', 'claude-haiku-5-5']])
    expect(result).toEqual({
      ok: true,
      value: { answer: read(null, 'niedrig'), conflictingDate: null },
    })
  })

  it('behält Versuch 1 als „bitte prüfen“, wenn der Zweitversuch scheitert', async () => {
    const { result, calls } = await run([
      { role: 'mhd', answer: read('2027-09-30', 'niedrig') },
      { role: 'mhd_zweitversuch', failure: { kind: 'rate-limited' } },
    ])

    expect(result).toEqual({
      ok: true,
      value: { answer: read('2027-09-30', 'niedrig'), conflictingDate: null },
    })
    expect(calls).toEqual([
      expect.objectContaining({ role: 'mhd', inputTokens: 0 }),
      expect.objectContaining({ role: 'mhd_zweitversuch', inputTokens: null }),
    ])
  })

  it('behält Versuch 1, wenn der Zweitversuch gegen das Schema verstößt', async () => {
    const { result } = await run([
      { role: 'mhd', answer: read(null, 'niedrig') },
      { role: 'mhd_zweitversuch', answer: SCHEMA_VIOLATION },
    ])

    expect(result).toEqual({
      ok: true,
      value: { answer: read(null, 'niedrig'), conflictingDate: null },
    })
  })

  it('versucht es nach einem Schema-Verstoß in Versuch 1 erneut', async () => {
    const { result, roles } = await run([
      { role: 'mhd', answer: SCHEMA_VIOLATION },
      { role: 'mhd_zweitversuch', answer: read('2027-08-31', 'hoch') },
    ])

    expect(roles.map(([role]) => role)).toEqual(['mhd', 'mhd_zweitversuch'])
    expect(result).toEqual({
      ok: true,
      value: { answer: read('2027-08-31', 'hoch'), conflictingDate: null },
    })
  })

  it('meldet den Schema-Verstoß, wenn auch der Zweitversuch scheitert', async () => {
    const { result, calls } = await run([
      { role: 'mhd', answer: SCHEMA_VIOLATION },
      { role: 'mhd_zweitversuch', failure: { kind: 'timeout' } },
    ])

    expect(result).toMatchObject({ ok: false, error: { kind: 'invalid-response' } })
    expect(calls).toHaveLength(2)
  })

  it('meldet einen Schema-Verstoß ohne Zweitversuch, wenn die Rolle nicht aktiv ist', async () => {
    const { result, roles } = await run([{ role: 'mhd', answer: SCHEMA_VIOLATION }], null)

    expect(result).toMatchObject({ ok: false, error: { kind: 'invalid-response' } })
    expect(roles).toHaveLength(1)
  })

  it('startet nach Zeitlimit oder anderem Fehler in Versuch 1 keinen Zweitversuch', async () => {
    const { result, roles } = await run([{ role: 'mhd', failure: { kind: 'timeout' } }])

    expect(result).toEqual({ ok: false, error: { kind: 'timeout' } })
    expect(roles).toHaveLength(1)
  })
})
