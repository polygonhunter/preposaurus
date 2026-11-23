import { describe, expect, it } from 'vitest'
import type { ProductNutrition } from '@/features/inventory/domain/nutrition-source'
import { planNutritionEdit } from './nutrition-edit'

const NOW = new Date('2026-11-23T10:00:00Z')
const EARLIER = new Date('2026-11-01T10:00:00Z')

const values = { kcal: 359, protein: 12.5, carbs: 70, fat: 1.5 }

const estimate: ProductNutrition = { values, source: 'ai-estimate', confirmedAt: null }

describe('planNutritionEdit', () => {
  it('macht aus geänderten Werten eine eigene Angabe ohne „geschätzt“', () => {
    expect(
      planNutritionEdit(
        estimate,
        { values: { ...values, kcal: 350 }, confirmEstimate: false },
        NOW,
      ),
    ).toEqual({ values: { ...values, kcal: 350 }, source: 'manual', confirmedAt: null })
  })

  it('bestätigt eine unveränderte Schätzung auf Wunsch', () => {
    expect(planNutritionEdit(estimate, { values, confirmEstimate: true }, NOW)).toEqual({
      ...estimate,
      confirmedAt: NOW,
    })
  })

  it('lässt eine unveränderte Schätzung ohne Wunsch unbestätigt', () => {
    expect(planNutritionEdit(estimate, { values, confirmEstimate: false }, NOW)).toEqual(estimate)
  })

  it('behält eine frühere Bestätigung und die Herkunft „Etikett“', () => {
    const confirmed = { ...estimate, confirmedAt: EARLIER }
    expect(planNutritionEdit(confirmed, { values, confirmEstimate: true }, NOW)).toEqual(confirmed)
    const label: ProductNutrition = { values, source: 'label', confirmedAt: null }
    expect(planNutritionEdit(label, { values, confirmEstimate: true }, NOW)).toEqual(label)
  })

  it('übersieht Rundung aus der DB', () => {
    const label: ProductNutrition = { values, source: 'label', confirmedAt: null }
    const edit = { values: { ...values, protein: 12.501 }, confirmEstimate: false }
    expect(planNutritionEdit(label, edit, NOW).source).toBe('label')
  })

  it('kehrt ohne Werte zum Richtwert zurück', () => {
    const empty = { kcal: null, protein: null, carbs: null, fat: null }
    expect(planNutritionEdit(estimate, { values: empty, confirmEstimate: true }, NOW)).toEqual({
      values: empty,
      source: null,
      confirmedAt: null,
    })
  })

  it('macht aus ersten Werten ohne gespeicherte Herkunft eine eigene Angabe', () => {
    const none: ProductNutrition = {
      values: { kcal: null, protein: null, carbs: null, fat: null },
      source: null,
      confirmedAt: null,
    }
    expect(planNutritionEdit(none, { values, confirmEstimate: false }, NOW).source).toBe('manual')
  })
})
