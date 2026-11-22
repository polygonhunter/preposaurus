import { describe, expect, it } from 'vitest'
import type { AiNutritionAnswer, AiNutritionEstimateAnswer, AiPackagingAnswer } from './ai-answers'
import {
  mapConfidence,
  mapNutritionAnswer,
  mapNutritionEstimateAnswer,
  mapPackagingAnswer,
} from './map-recognition'

const packaging = (overrides: Partial<AiPackagingAnswer>): AiPackagingAnswer => ({
  bezeichnung: 'Spaghetti',
  lebensmittelart: 'spaghetti',
  behaelter: 'packung',
  inhalt: { wert: 500, einheit: 'g' },
  abtropfgewicht_g: null,
  sicherheit: 'hoch',
  ...overrides,
})

const nutrition = (overrides: Partial<AiNutritionAnswer>): AiNutritionAnswer => ({
  bezug: '100g',
  portionsgroesse: null,
  kcal: 359,
  kj: 1521,
  eiweiss_g: 13,
  kohlenhydrate_g: 71,
  fett_g: 1.5,
  sicherheit: 'hoch',
  ...overrides,
})

describe('mapConfidence', () => {
  it('übersetzt die Sicherheit der KI', () => {
    expect(['hoch', 'mittel', 'niedrig'].map((value) => mapConfidence(value as never))).toEqual([
      'high',
      'medium',
      'low',
    ])
  })
})

describe('mapPackagingAnswer', () => {
  it('übernimmt einen vollständigen Vorschlag', () => {
    expect(mapPackagingAnswer(packaging({ abtropfgewicht_g: 240 }))).toEqual({
      name: 'Spaghetti',
      foodTypeKey: 'spaghetti',
      container: 'packung',
      content: { value: 500, unit: 'g' },
      drainedWeightG: 240,
      confidence: 'high',
    })
  })

  it('lässt null überall null', () => {
    const suggestion = mapPackagingAnswer(
      packaging({
        bezeichnung: null,
        lebensmittelart: null,
        inhalt: { wert: null, einheit: null },
        sicherheit: 'niedrig',
      }),
    )

    expect(suggestion).toMatchObject({
      name: null,
      foodTypeKey: null,
      content: null,
      drainedWeightG: null,
      confidence: 'low',
    })
  })

  it('lässt einen fehlenden Behälter leer und macht eine leere Bezeichnung zu null', () => {
    const suggestion = mapPackagingAnswer(packaging({ behaelter: null, bezeichnung: '  ' }))

    expect(suggestion.container).toBeNull()
    expect(suggestion.name).toBeNull()
  })

  it.each([
    { wert: 0, einheit: 'g' },
    { wert: -5, einheit: 'ml' },
    { wert: Number.NaN, einheit: 'g' },
    { wert: 500, einheit: null },
  ] as const)('verwirft einen Inhalt, der keine Menge über null ist (%o)', (inhalt) => {
    expect(mapPackagingAnswer(packaging({ inhalt })).content).toBeNull()
  })

  it('verwirft ein Abtropfgewicht von null Gramm', () => {
    expect(mapPackagingAnswer(packaging({ abtropfgewicht_g: 0 })).drainedWeightG).toBeNull()
  })
})

describe('mapNutritionAnswer', () => {
  it('übernimmt Werte je 100 g, kcal vor kJ', () => {
    expect(mapNutritionAnswer(nutrition({}))).toEqual({
      values: { kcal: 359, protein: 13, carbs: 71, fat: 1.5 },
      isPerPortion: false,
      source: 'label',
      confidence: 'high',
    })
  })

  it('rechnet nur kJ in kcal um', () => {
    const { values } = mapNutritionAnswer(nutrition({ kcal: null, kj: 418.4 }))

    expect(values.kcal).toBeCloseTo(100)
  })

  it('rechnet Werte je Portion mit bekannter Portionsgröße auf 100 um', () => {
    const suggestion = mapNutritionAnswer(
      nutrition({ bezug: 'portion', portionsgroesse: 50, kcal: 180, eiweiss_g: null }),
    )

    expect(suggestion.values).toEqual({ kcal: 360, protein: null, carbs: 142, fat: 3 })
    expect(suggestion.isPerPortion).toBe(false)
  })

  it('lässt Werte je Portion ohne Portionsgröße stehen und markiert sie', () => {
    const suggestion = mapNutritionAnswer(nutrition({ bezug: 'portion', portionsgroesse: 0 }))

    expect(suggestion.isPerPortion).toBe(true)
    expect(suggestion.values.kcal).toBe(359)
  })

  it('verwirft negative Werte und lässt null null', () => {
    const { values } = mapNutritionAnswer(
      nutrition({ kcal: -1, kj: null, eiweiss_g: null, fett_g: -0.5, bezug: '100ml' }),
    )

    expect(values).toEqual({ kcal: null, protein: null, carbs: 71, fat: null })
  })
})

describe('mapNutritionEstimateAnswer', () => {
  it('kennzeichnet jede Schätzung mit der Herkunft ai-estimate', () => {
    const estimate: AiNutritionEstimateAnswer = {
      kcal: 350,
      eiweiss_g: 12,
      kohlenhydrate_g: null,
      fett_g: 2,
      sicherheit: 'mittel',
    }

    expect(mapNutritionEstimateAnswer(estimate)).toEqual({
      values: { kcal: 350, protein: 12, carbs: null, fat: 2 },
      isPerPortion: false,
      source: 'ai-estimate',
      confidence: 'medium',
    })
  })
})
