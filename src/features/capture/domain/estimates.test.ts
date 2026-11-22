import { describe, expect, it } from 'vitest'
import { fillMissingNutrition, type NutritionValues } from './estimates'

// TESTDATEN: Kategorie-Durchschnitt, frei gewählt (echte Werte kommen als Seed, U3)
const TEST_AVERAGE: NutritionValues = { kcal: 350, protein: 12, carbs: 70, fat: 2 }
const none: NutritionValues = { kcal: null, protein: null, carbs: null, fat: null }

describe('fillMissingNutrition', () => {
  it('nimmt ohne Nährwertfoto den Kategorie-Durchschnitt, markiert als geschätzt', () => {
    expect(fillMissingNutrition(none, TEST_AVERAGE)).toEqual({
      values: TEST_AVERAGE,
      isEstimated: true,
    })
  })

  it('lässt vollständige echte Werte unmarkiert', () => {
    const actual = { kcal: 359, protein: 13, carbs: 71, fat: 1.5 }
    expect(fillMissingNutrition(actual, TEST_AVERAGE)).toEqual({
      values: actual,
      isEstimated: false,
    })
  })

  it('ergänzt nur fehlende Felder und markiert dann das Produkt', () => {
    const actual = { kcal: 359, protein: null, carbs: 71, fat: null }
    expect(fillMissingNutrition(actual, TEST_AVERAGE)).toEqual({
      values: { kcal: 359, protein: 12, carbs: 71, fat: 2 },
      isEstimated: true,
    })
  })

  it('erfindet nichts, wenn auch der Durchschnitt fehlt', () => {
    expect(fillMissingNutrition(none, none)).toEqual({ values: none, isEstimated: false })
  })

  it('behält eine echte 0, etwa 0 kcal bei Wasser', () => {
    const water = { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    expect(fillMissingNutrition(water, TEST_AVERAGE).isEstimated).toBe(false)
  })
})
