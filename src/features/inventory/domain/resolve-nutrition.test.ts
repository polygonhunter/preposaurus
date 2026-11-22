import { describe, expect, it } from 'vitest'
import type { NutritionValues, ProductNutrition, StoredNutritionSource } from './nutrition-source'
import { hasEstimatedKcal, resolveNutrition } from './resolve-nutrition'

// TESTDATEN: Richtwert einer Lebensmittelart und Etikettwerte, frei gewählt
const REFERENCE: NutritionValues = { kcal: 350, protein: 12, carbs: 70, fat: 2 }
const none: NutritionValues = { kcal: null, protein: null, carbs: null, fat: null }
const confirmedAt = new Date('2026-11-22T10:00:00Z')

const product = (
  values: NutritionValues,
  source: StoredNutritionSource | null,
  confirmed = false,
): ProductNutrition => ({ values, source, confirmedAt: confirmed ? confirmedAt : null })

describe('resolveNutrition', () => {
  it('nimmt ohne eigene Werte den Richtwert, je Feld mit Herkunft „reference“', () => {
    expect(resolveNutrition(product(none, null), REFERENCE)).toEqual({
      kcal: { value: 350, origin: 'reference' },
      protein: { value: 12, origin: 'reference' },
      carbs: { value: 70, origin: 'reference' },
      fat: { value: 2, origin: 'reference' },
    })
  })

  it('Etikett plus teilweise Richtwert: jeder Wert behält seine eigene Herkunft', () => {
    const label = product({ kcal: 359, protein: 13, carbs: 71, fat: null }, 'label')
    expect(resolveNutrition(label, REFERENCE)).toEqual({
      kcal: { value: 359, origin: 'label' },
      protein: { value: 13, origin: 'label' },
      carbs: { value: 71, origin: 'label' },
      fat: { value: 2, origin: 'reference' },
    })
  })

  it('verändert das gespeicherte Produkt nicht', () => {
    const label = product({ kcal: 359, protein: null, carbs: null, fat: null }, 'label')
    resolveNutrition(label, REFERENCE)
    expect(label).toEqual(product({ kcal: 359, protein: null, carbs: null, fat: null }, 'label'))
  })

  it('übernimmt Handeingabe und KI-Schätzung als Herkunft', () => {
    const manual = product({ ...none, kcal: 100 }, 'manual')
    const estimate = product({ ...none, kcal: 200 }, 'ai-estimate', true)

    expect(resolveNutrition(manual, null).kcal).toEqual({ value: 100, origin: 'manual' })
    expect(resolveNutrition(estimate, null).kcal).toEqual({ value: 200, origin: 'ai-estimate' })
  })

  it('erfindet nichts ohne Richtwert, auch nicht bei teilweisem Richtwert', () => {
    const empty = { value: null, origin: null }
    expect(resolveNutrition(product(none, null), null).kcal).toEqual(empty)
    const partial = { ...none, kcal: 350 }
    expect(resolveNutrition(product(none, null), partial).fat).toEqual(empty)
  })

  it('behält eine echte 0 vom Etikett, etwa bei Wasser', () => {
    const water = product({ kcal: 0, protein: 0, carbs: 0, fat: 0 }, 'label')
    expect(resolveNutrition(water, REFERENCE).kcal).toEqual({ value: 0, origin: 'label' })
  })

  it('wertet eigene Werte ohne gespeicherte Herkunft als Handeingabe', () => {
    const legacy = product({ ...none, kcal: 120 }, null)
    expect(resolveNutrition(legacy, REFERENCE).kcal).toEqual({ value: 120, origin: 'manual' })
  })
})

describe('hasEstimatedKcal', () => {
  it('richtet sich nach der Herkunft der kcal, nicht nach anderen Feldern', () => {
    const label = product({ kcal: 359, protein: null, carbs: null, fat: null }, 'label')
    expect(hasEstimatedKcal(resolveNutrition(label, REFERENCE))).toBe(false)
    const noKcal = product({ kcal: null, protein: 13, carbs: 71, fat: 1 }, 'label')
    expect(hasEstimatedKcal(resolveNutrition(noKcal, REFERENCE))).toBe(true)
  })

  it('bleibt bei einer KI-Schätzung auch nach der Bestätigung eine Schätzung', () => {
    const confirmed = product({ ...none, kcal: 200 }, 'ai-estimate', true)
    const open = product({ ...none, kcal: 200 }, 'ai-estimate')

    expect(hasEstimatedKcal(resolveNutrition(confirmed, null))).toBe(true)
    expect(hasEstimatedKcal(resolveNutrition(open, null))).toBe(true)
  })

  it('ist falsch für Etikett, Handeingabe und fehlende kcal', () => {
    expect(hasEstimatedKcal(resolveNutrition(product({ ...none, kcal: 1 }, 'label'), null))).toBe(
      false,
    )
    expect(hasEstimatedKcal(resolveNutrition(product({ ...none, kcal: 1 }, 'manual'), null))).toBe(
      false,
    )
    expect(hasEstimatedKcal(resolveNutrition(product(none, null), null))).toBe(false)
  })
})
