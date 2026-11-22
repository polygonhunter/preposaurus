import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import { findIncomplete, isMissingBestBefore, nutritionGapOf } from './incomplete'
import {
  isNutritionUnconfirmed,
  type NutritionSource,
  type ProductNutrition,
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

const nutrition = (
  source: NutritionSource,
  options: { confirmed?: boolean; kcal?: number | null } = {},
): ProductNutrition => ({
  values: { ...values, kcal: options.kcal === undefined ? values.kcal : options.kcal },
  source,
  confirmedAt: options.confirmed === true ? confirmedAt : null,
})

describe('isNutritionUnconfirmed', () => {
  it('Etikett und Handeingabe gelten ohne gesonderte Bestätigung', () => {
    expect(isNutritionUnconfirmed(nutrition('label'))).toBe(false)
    expect(isNutritionUnconfirmed(nutrition('manual'))).toBe(false)
  })

  it('Richtwert und KI-Schätzung sind bis zur Bestätigung unbestätigt', () => {
    expect(isNutritionUnconfirmed(nutrition('reference'))).toBe(true)
    expect(isNutritionUnconfirmed(nutrition('ai-estimate'))).toBe(true)
    expect(isNutritionUnconfirmed(nutrition('reference', { confirmed: true }))).toBe(false)
    expect(isNutritionUnconfirmed(nutrition('ai-estimate', { confirmed: true }))).toBe(false)
  })
})

describe('isMissingBestBefore', () => {
  it('erkennt Packungen im Vorrat ohne Datum', () => {
    expect(isMissingBestBefore(unit('a', false))).toBe(true)
    expect(isMissingBestBefore(unit('b', true))).toBe(false)
  })

  it('übergeht verbrauchte und entsorgte Packungen ohne Datum', () => {
    expect(isMissingBestBefore(unit('a', false, 'consumed'))).toBe(false)
    expect(isMissingBestBefore(unit('b', false, 'discarded'))).toBe(false)
  })
})

describe('nutritionGapOf', () => {
  it('meldet fehlende kcal vor einer fehlenden Bestätigung', () => {
    expect(nutritionGapOf(nutrition('reference', { kcal: null }))).toBe('missing')
    expect(nutritionGapOf(nutrition('label', { kcal: null }))).toBe('missing')
  })

  it('meldet unbestätigte Richtwerte und Schätzungen', () => {
    expect(nutritionGapOf(nutrition('reference'))).toBe('unconfirmed')
    expect(nutritionGapOf(nutrition('ai-estimate'))).toBe('unconfirmed')
  })

  it('meldet nichts bei Etikett, Handeingabe oder bestätigtem Richtwert', () => {
    expect(nutritionGapOf(nutrition('label'))).toBeNull()
    expect(nutritionGapOf(nutrition('manual'))).toBeNull()
    expect(nutritionGapOf(nutrition('reference', { confirmed: true }))).toBeNull()
  })

  it('behandelt 0 kcal als Wert, nicht als Lücke', () => {
    expect(nutritionGapOf(nutrition('label', { kcal: 0 }))).toBeNull()
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
      { id: 'etikett', nutrition: nutrition('label') },
      { id: 'richtwert', nutrition: nutrition('reference') },
      { id: 'ohne-kcal', nutrition: nutrition('manual', { kcal: null }) },
    ]
    const result = findIncomplete({ units, products })

    expect(result.units.map((entry) => entry.id)).toEqual(['a', 'c'])
    expect(result.products.map(({ product, gap }) => [product.id, gap])).toEqual([
      ['richtwert', 'unconfirmed'],
      ['ohne-kcal', 'missing'],
    ])
  })

  it('liefert leere Listen bei vollständigem oder leerem Vorrat', () => {
    expect(findIncomplete({ units: [], products: [] })).toEqual({ units: [], products: [] })
    const complete = findIncomplete({
      units: [unit('a', true)],
      products: [{ nutrition: nutrition('label') }],
    })
    expect(complete).toEqual({ units: [], products: [] })
  })
})
