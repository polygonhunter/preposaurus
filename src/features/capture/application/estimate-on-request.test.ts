import { describe, expect, it } from 'vitest'
import { createFakeVisionRecognizer, type FakeAnswer } from '@/server/ai/fake-vision-recognizer'
import type { AiImage } from '@/server/ai/vision-recognizer'
import { AI_ROLES, AI_ROLE_DEFAULT_MODELS } from '@/shared/config/ai-roles'
import { toCalendarDay } from '@/shared/lib/dates'
import { mapBestBeforeAnswer } from '../domain/map-best-before-recognition'
import { mapNutritionAnswer } from '../domain/map-recognition'
import { estimateBestBefore, estimateNutrition } from './estimate-on-request'
import { recognizeBestBefore } from './recognize-best-before'

const image: AiImage = { data: new Uint8Array([1, 2, 3]), mimeType: 'image/jpeg' }
const today = toCalendarDay('2026-11-22')
const context = { foodType: { key: 'nudeln', name: 'Nudeln' }, productName: 'Spaghetti' }
const ESTIMATE_ROLES = ['naehrwerte_schaetzen', 'mhd_schaetzen']

const NO_DATE = { roh_text: null, datum: null, genauigkeit: 'unbekannt', art: 'unbekannt' }

function run(answers: FakeAnswer[]) {
  const recognizer = createFakeVisionRecognizer(answers)
  const base = { recognizer, image, context }
  return {
    recognizer,
    bestBefore: () =>
      estimateBestBefore({ ...base, model: AI_ROLE_DEFAULT_MODELS.mhd_schaetzen, today }),
    nutrition: () =>
      estimateNutrition({ ...base, model: AI_ROLE_DEFAULT_MODELS.naehrwerte_schaetzen }),
  }
}

describe('estimateBestBefore (nur auf Wahl)', () => {
  it('liefert ein gekennzeichnetes Monatsende aus der Haltbarkeit in Monaten', async () => {
    const { bestBefore, recognizer } = run([
      {
        role: 'mhd_schaetzen',
        answer: { haltbar_monate: 24, sicherheit: 'mittel' },
      },
    ])

    expect(await bestBefore()).toEqual({
      ok: true,
      value: {
        bestBefore: { date: '2028-11-30', precision: 'month', isEstimated: true },
        confidence: 'medium',
      },
    })
    expect(recognizer.requests).toEqual([
      expect.objectContaining({ role: 'mhd_schaetzen', model: 'claude-haiku-5-5', context }),
    ])
  })

  it('erfindet nichts, wenn die KI nicht schätzen kann', async () => {
    const { bestBefore } = run([])

    expect(await bestBefore()).toEqual({ ok: false, error: { kind: 'no-estimate' } })
  })

  it('reicht einen Fehler der KI durch', async () => {
    const { bestBefore } = run([{ role: 'mhd_schaetzen', failure: { kind: 'timeout' } }])

    expect(await bestBefore()).toEqual({ ok: false, error: { kind: 'timeout' } })
  })
})

describe('estimateNutrition (nur auf Wahl)', () => {
  it('liefert die Werte als unbestätigte KI-Schätzung', async () => {
    const values = { kcal: 350, eiweiss_g: 12, kohlenhydrate_g: 70, fett_g: null }
    const { nutrition } = run([
      { role: 'naehrwerte_schaetzen', answer: { ...values, sicherheit: 'niedrig' } },
    ])

    expect(await nutrition()).toEqual({
      ok: true,
      value: {
        values: { kcal: 350, protein: 12, carbs: 70, fat: null },
        source: 'ai-estimate',
        isConfirmed: false,
        confidence: 'low',
      },
    })
  })

  it('ohne einen einzigen Wert gilt der Richtwert, nicht eine leere Schätzung', async () => {
    const { nutrition } = run([])

    expect(await nutrition()).toEqual({ ok: false, error: { kind: 'no-estimate' } })
  })
})

describe('keine Schätzung ohne ausdrückliche Wahl', () => {
  it('die Erkennung ruft bei fehlendem Datum keine Schätz-Rolle auf, auch nicht im Zweitversuch', async () => {
    const recognizer = createFakeVisionRecognizer([
      { role: 'mhd', answer: { ...NO_DATE, sicherheit: 'niedrig' } },
      { role: 'mhd_zweitversuch', answer: { ...NO_DATE, sicherheit: 'niedrig' } },
    ])

    const { result } = await recognizeBestBefore({
      recognizer,
      image,
      models: { first: 'haiku', second: 'sonnet' },
    })

    const roles = recognizer.requests.map((request) => request.role)
    expect(roles).toEqual(['mhd', 'mhd_zweitversuch'])
    expect(roles.some((role) => ESTIMATE_ROLES.includes(role))).toBe(false)
    expect(result.ok && mapBestBeforeAnswer(result.value.answer).bestBefore).toBeNull()
  })

  it('das Lesen eines Datums setzt nie das Kennzeichen „geschätzt“', () => {
    for (const genauigkeit of ['tag', 'monat', 'jahr', 'unbekannt'] as const) {
      for (const datum of ['2027-09-30', null]) {
        const reading = mapBestBeforeAnswer({
          ...NO_DATE,
          datum,
          genauigkeit,
          art: 'mhd',
          sicherheit: 'niedrig',
        })
        expect(reading.bestBefore?.isEstimated ?? false).toBe(false)
      }
    }
  })

  it('eine gelesene Nährwerttabelle ist nie eine Schätzung, auch ohne Werte', () => {
    const empty = { kcal: null, kj: null, eiweiss_g: null, kohlenhydrate_g: null, fett_g: null }
    for (const bezug of ['100g', '100ml', 'portion'] as const) {
      const suggestion = mapNutritionAnswer({
        ...empty,
        bezug,
        portionsgroesse: null,
        sicherheit: 'niedrig',
      })
      expect(suggestion.source).toBe('label')
    }
  })

  it('kennt genau zwei Schätz-Rollen', () => {
    expect(AI_ROLES.filter((role) => role.endsWith('_schaetzen'))).toEqual(ESTIMATE_ROLES)
  })
})
