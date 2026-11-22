import { describe, expect, it } from 'vitest'
import type { BestBeforeGroupDto, FoodTypeDetail, NutritionDto } from '../schemas'
import { fifoGroupOf, nutritionLine, nutritionOrigin, shelfLifeColumns } from './detail-view'

type DetailProduct = FoodTypeDetail['products'][number]

const unitsOf = (...ids: string[]) =>
  ids.map((id) => ({ id, kind: 'best-before' as const, checkedAt: null }))

const dated = (date: string, ids: string[]): BestBeforeGroupDto => ({
  kind: 'dated',
  date,
  precision: 'month',
  isEstimated: false,
  state: 'good',
  units: unitsOf(...ids),
})

function nutrition(overrides: Partial<NutritionDto> = {}): NutritionDto {
  const value = (number: number | null, origin: 'label' | 'reference' | null = 'label') => ({
    value: number,
    origin: number === null ? null : origin,
  })
  return {
    source: 'label',
    isConfirmed: true,
    per100: { kcal: value(359), protein: value(13), carbs: value(71.5), fat: value(null) },
    perPackage: { kcal: null, protein: null, carbs: null, fat: null },
    isKcalEstimated: false,
    gap: null,
    ...overrides,
  }
}

const productWith = (groups: BestBeforeGroupDto[]) =>
  ({ bestBeforeGroups: groups }) as unknown as DetailProduct

describe('Detailseite', () => {
  it('fasst gleiche Daten über Produkte zu einer Säule, ohne Datum zuletzt', () => {
    const columns = shelfLifeColumns([
      productWith([dated('2028-03-31', ['a']), { kind: 'no-date', units: unitsOf('b') }]),
      productWith([dated('2027-11-30', ['c', 'd']), dated('2028-03-31', ['e'])]),
    ])

    expect(columns.map(({ label, count, state }) => [label, count, state])).toEqual([
      ['11/2027', 2, 'good'],
      ['03/2028', 2, 'good'],
      ['Datum fehlt', 1, 'no-date'],
    ])
  })

  it('findet die Datumszeile der Packung für „1 entnehmen“', () => {
    const first = dated('2027-11-30', ['c', 'd'])
    const products = [productWith([first])]

    expect(fifoGroupOf(products, 'd')).toBe(first)
    expect(fifoGroupOf(products, 'x')).toBeNull()
    expect(fifoGroupOf(products, null)).toBeNull()
  })

  it('schreibt Nährwerte je 100 g, fehlende Makros fallen weg', () => {
    expect(nutritionLine(nutrition())).toBe('359 kcal · 13 g Eiweiß · 71,5 g KH')
    expect(nutritionOrigin(nutrition())).toBe('vom Etikett')
  })

  it('markiert Richtwerte mit „ca.“ und sagt, wenn kcal fehlen', () => {
    const reference = nutrition({
      isKcalEstimated: true,
      per100: {
        kcal: { value: 350, origin: 'reference' },
        protein: { value: null, origin: null },
        carbs: { value: null, origin: null },
        fat: { value: null, origin: null },
      },
    })
    const missing = nutrition({
      per100: { ...reference.per100, kcal: { value: null, origin: null } },
    })

    expect(nutritionLine(reference)).toBe('ca. 350 kcal')
    expect(nutritionOrigin(reference)).toBe('Richtwert')
    expect(nutritionLine(missing)).toBeNull()
    expect(nutritionOrigin(missing)).toBeNull()
  })
})
