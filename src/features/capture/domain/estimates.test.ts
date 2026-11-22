import { describe, expect, it } from 'vitest'
import type {
  NutritionValues,
  ProductNutrition,
} from '@/features/inventory/domain/nutrition-source'
import { fillMissingNutrition } from './estimates'

// TESTDATEN: Richtwert einer Lebensmittelart, frei gewählt (echte Werte kommen als Seed, U3)
const TEST_REFERENCE: NutritionValues = { kcal: 350, protein: 12, carbs: 70, fat: 2 }
const none: NutritionValues = { kcal: null, protein: null, carbs: null, fat: null }
const confirmedAt = new Date('2026-11-22T10:00:00Z')

const fromLabel = (values: NutritionValues): ProductNutrition => ({
  values,
  source: 'label',
  confirmedAt: null,
})

describe('fillMissingNutrition', () => {
  it('nimmt ohne Nährwerttabelle den Richtwert der Lebensmittelart, unbestätigt', () => {
    expect(fillMissingNutrition(fromLabel(none), TEST_REFERENCE)).toEqual({
      values: TEST_REFERENCE,
      source: 'reference',
      confirmedAt: null,
    })
  })

  it('lässt vollständige Werte vom Etikett unverändert', () => {
    const actual = fromLabel({ kcal: 359, protein: 13, carbs: 71, fat: 1.5 })
    expect(fillMissingNutrition(actual, TEST_REFERENCE)).toEqual(actual)
  })

  it('ergänzt nur fehlende Felder und setzt dann die Herkunft auf Richtwert', () => {
    const actual = fromLabel({ kcal: 359, protein: null, carbs: 71, fat: null })
    expect(fillMissingNutrition(actual, TEST_REFERENCE)).toEqual({
      values: { kcal: 359, protein: 12, carbs: 71, fat: 2 },
      source: 'reference',
      confirmedAt: null,
    })
  })

  it('hebt eine Bestätigung auf, sobald neue Richtwerte dazukommen', () => {
    const confirmed: ProductNutrition = {
      values: { ...none, kcal: 300 },
      source: 'ai-estimate',
      confirmedAt,
    }
    expect(fillMissingNutrition(confirmed, TEST_REFERENCE)).toMatchObject({
      source: 'reference',
      confirmedAt: null,
    })
  })

  it('erfindet nichts, wenn die Lebensmittelart keinen Richtwert hat', () => {
    expect(fillMissingNutrition(fromLabel(none), null)).toEqual(fromLabel(none))
    expect(fillMissingNutrition(fromLabel(none), none)).toEqual(fromLabel(none))
  })

  it('behält eine echte 0, etwa 0 kcal bei Wasser', () => {
    const water = fromLabel({ kcal: 0, protein: 0, carbs: 0, fat: 0 })
    expect(fillMissingNutrition(water, TEST_REFERENCE)).toEqual(water)
  })

  it('übernimmt nur die Werte, die der Richtwert kennt', () => {
    const partial = { kcal: 350, protein: null, carbs: null, fat: null }
    expect(fillMissingNutrition(fromLabel(none), partial).values).toEqual(partial)
  })
})
