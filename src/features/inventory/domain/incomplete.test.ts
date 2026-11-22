import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import { findIncomplete, nutritionGapOf } from './incomplete'
import {
  isEstimateUnconfirmed,
  type ProductNutrition,
  type StoredNutritionSource,
} from './nutrition-source'
import type { StockUnit, UnitStatus } from './unit'

const dated = { date: toCalendarDay('2027-09-30'), precision: 'month', isEstimated: false } as const
const confirmedAt = new Date('2026-11-22T10:00:00Z')
// TESTDATEN: frei gewählte Nährwerte
const values = { kcal: 350, protein: 12, carbs: 70, fat: 2 }

const unit = (id: string, withDate: boolean, status: UnitStatus = 'stock') =>
  ({ id, status, bestBefore: withDate ? dated : null }) satisfies Pick<
    StockUnit,
    'id' | 'status' | 'bestBefore'
  >

const REFERENCE = { kcal: 340, protein: 11, carbs: 68, fat: 2 }
const none = { kcal: null, protein: null, carbs: null, fat: null }

const nutrition = (
  source: StoredNutritionSource,
  options: { confirmed?: boolean; kcal?: number | null } = {},
): ProductNutrition => ({
  values: { ...values, kcal: options.kcal === undefined ? values.kcal : options.kcal },
  source,
  confirmedAt: options.confirmed === true ? confirmedAt : null,
})

describe('isEstimateUnconfirmed', () => {
  it('Etikett und Handeingabe brauchen keine gesonderte Bestätigung', () => {
    expect(isEstimateUnconfirmed(nutrition('label'))).toBe(false)
    expect(isEstimateUnconfirmed(nutrition('manual'))).toBe(false)
    expect(isEstimateUnconfirmed({ source: null, confirmedAt: null })).toBe(false)
  })

  it('eine KI-Schätzung ist bis zur Bestätigung unbestätigt', () => {
    expect(isEstimateUnconfirmed(nutrition('ai-estimate'))).toBe(true)
    expect(isEstimateUnconfirmed(nutrition('ai-estimate', { confirmed: true }))).toBe(false)
  })
})

describe('nutritionGapOf', () => {
  const noOwnValues: ProductNutrition = { values: none, source: null, confirmedAt: null }

  it('meldet fehlende kcal, wenn auch kein Richtwert hilft', () => {
    expect(nutritionGapOf(noOwnValues, null)).toBe('missing')
    expect(nutritionGapOf(nutrition('label', { kcal: null }), null)).toBe('missing')
    expect(nutritionGapOf(nutrition('ai-estimate', { kcal: null }), { ...none })).toBe('missing')
  })

  it('meldet ein Produkt ohne eigene Werte, für das der Richtwert zählt', () => {
    expect(nutritionGapOf(noOwnValues, REFERENCE)).toBe('no-label')
  })

  it('meldet eine unbestätigte KI-Schätzung', () => {
    expect(nutritionGapOf(nutrition('ai-estimate'), REFERENCE)).toBe('unconfirmed')
  })

  it('meldet nichts bei Etikett, Handeingabe oder bestätigter Schätzung', () => {
    expect(nutritionGapOf(nutrition('label'), null)).toBeNull()
    expect(nutritionGapOf(nutrition('manual'), null)).toBeNull()
    expect(nutritionGapOf(nutrition('ai-estimate', { confirmed: true }), null)).toBeNull()
  })

  it('meldet nichts, wenn das Etikett nur teilweise ergänzt wird', () => {
    const partial: ProductNutrition = {
      values: { ...none, kcal: 359 },
      source: 'label',
      confirmedAt: null,
    }
    expect(nutritionGapOf(partial, REFERENCE)).toBeNull()
  })

  it('behandelt 0 kcal als Wert, nicht als Lücke', () => {
    expect(nutritionGapOf(nutrition('label', { kcal: 0 }), null)).toBeNull()
  })
})

describe('findIncomplete', () => {
  it('sammelt Packungen ohne Datum und Produkte mit Lücken in Eingabereihenfolge', () => {
    const units = [
      unit('a', false),
      unit('b', true),
      unit('c', false),
      unit('d', false, 'consumed'),
    ]
    const products = [
      { id: 'etikett', nutrition: nutrition('label'), foodTypeReference: REFERENCE },
      { id: 'schaetzung', nutrition: nutrition('ai-estimate'), foodTypeReference: null },
      {
        id: 'richtwert',
        nutrition: { values: none, source: null, confirmedAt: null },
        foodTypeReference: REFERENCE,
      },
      { id: 'ohne-kcal', nutrition: nutrition('manual', { kcal: null }), foodTypeReference: null },
    ]
    const result = findIncomplete({ units, products })

    expect(result.units.map((entry) => entry.id)).toEqual(['a', 'c'])
    expect(result.products.map(({ product, gap }) => [product.id, gap])).toEqual([
      ['schaetzung', 'unconfirmed'],
      ['richtwert', 'no-label'],
      ['ohne-kcal', 'missing'],
    ])
  })

  it('liefert leere Listen bei vollständigem oder leerem Vorrat', () => {
    expect(findIncomplete({ units: [], products: [] })).toEqual({ units: [], products: [] })
    const complete = findIncomplete({
      units: [unit('a', true)],
      products: [{ nutrition: nutrition('label'), foodTypeReference: null }],
    })
    expect(complete).toEqual({ units: [], products: [] })
  })
})
