import { describe, expect, expectTypeOf, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import type { StockStatusFilter } from '../domain/stock-filter'
import { type StockFilter, stockFilterSchema } from '../schemas/requests'
import {
  createFakeStockReader,
  product,
  reisCategory,
  unit,
} from '../../../../tests/helpers/fake-stock-reader'
import { searchStock } from './search-stock'

const today = toCalendarDay('2026-11-22')
const householdId = 'haushalt-a'
const can = { id: '00000000-0000-4000-8000-0000000000d1', name: 'Dose' }
const cellar = { id: '00000000-0000-4000-8000-0000000000c1', name: 'Keller' }

// Ravioli mit unbestätigter KI-Schätzung: zählt im Filter „Unvollständig“
const ravioli = product({
  id: 'ravioli',
  name: 'Ravioli',
  foodType: null,
  category: { id: 'kat-fertig', name: 'Fertiggerichte', pictogram: '🥫' },
  group: { key: 'sonstiges', name: 'Sonstiges', shortName: 'Sonstiges' },
  container: can,
  nutrition: {
    values: { kcal: 90, protein: 3, carbs: 12, fat: 3 },
    source: 'ai-estimate',
    confirmedAt: null,
  },
})

const reader = createFakeStockReader({
  householdId,
  products: [
    product({ id: 'nudeln', storageLocation: cellar }),
    product({ id: 'reis', name: 'Reis lose', foodType: null, category: reisCategory }),
    ravioli,
  ],
  units: [
    unit('nudeln', '2028-01-31'),
    unit('nudeln', '2026-12-01'),
    unit('nudeln', null),
    unit('nudeln', '2026-11-01', { status: 'consumed' }),
    unit('reis', '2026-11-10'),
    unit('reis', '2026-11-01', { status: 'discarded' }),
    unit('ravioli', '2028-05-31'),
  ],
  options: { containers: [can], storageLocations: [cellar] },
})

const search = (filter: Record<string, string>, household = householdId) =>
  searchStock(reader, { householdId: household, today, filter: stockFilterSchema.parse(filter) })

describe('searchStock', () => {
  it('spiegelt die Zustands-Filter des Schemas genau im Domain-Typ', () => {
    expectTypeOf<StockFilter['status']>().toEqualTypeOf<StockStatusFilter>()
  })

  it('zählt jeden Zustand in Packungen, auch Verbraucht und Entsorgt', async () => {
    const result = await search({})

    expect(result.counts).toEqual({
      'in-stock': 5,
      'due-soon': 1,
      expired: 1,
      incomplete: 2,
      consumed: 1,
      discarded: 1,
    })
    expect(result.options).toEqual({ containers: [can], storageLocations: [cellar] })
  })

  it('zeigt im Treffermodus die Zeilen gegliedert nach Warengruppe', async () => {
    const result = await search({})

    expect(
      result.groups.map((group) => [group.key, group.rows.map((row) => row.matchingPackages)]),
    ).toEqual([
      ['getreide', [3, 1]],
      ['sonstiges', [1]],
    ])
  })

  it('filtert nach Zustand, auch nach berechnetem wie „Unvollständig“', async () => {
    const incomplete = await search({ status: 'incomplete' })
    const consumed = await search({ status: 'consumed' })

    expect(incomplete.groups.flatMap((group) => group.rows.map((row) => row.name))).toEqual([
      'Spaghetti',
      'Ravioli',
    ])
    expect(consumed.groups[0]?.rows[0]).toMatchObject({
      name: 'Spaghetti',
      matchingPackages: 1,
      packagesInStock: 3,
    })
  })

  it('sucht über Bezeichnung und Lebensmittelart, die Zähler folgen der Suche', async () => {
    const result = await search({ search: 'spag' })

    expect(result.groups.flatMap((group) => group.rows.map((row) => row.name))).toEqual([
      'Spaghetti',
    ])
    expect(result.counts['in-stock']).toBe(3)
  })

  it('filtert nach Behälter und Lagerort', async () => {
    const cans = await search({ containerId: can.id })
    const inCellar = await search({ storageLocationId: cellar.id })

    expect(cans.groups.map((group) => group.key)).toEqual(['sonstiges'])
    expect(inCellar.counts['in-stock']).toBe(3)
  })

  it('findet für einen fremden Haushalt nichts', async () => {
    const result = await search({}, 'haushalt-b')

    expect(result.groups).toEqual([])
    expect(result.counts['in-stock']).toBe(0)
  })
})
