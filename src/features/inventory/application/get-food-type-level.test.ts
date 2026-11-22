import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import {
  createFakeStockReader,
  product,
  reisCategory,
  unit,
} from '../../../../tests/helpers/fake-stock-reader'
import { getFoodTypeLevel } from './get-food-type-level'

const today = toCalendarDay('2026-11-22')
const householdId = 'haushalt-a'

// Reis ohne Lebensmittelart (heute erlaubt): steht als eigene Zeile unter seiner Kategorie
const looseRice = product({
  id: 'reis',
  name: 'Reis lose',
  foodType: null,
  category: reisCategory,
  content: { value: 1000, unit: 'g' },
})

const reader = createFakeStockReader({
  householdId,
  products: [
    product({ id: 'nudeln' }),
    product({ id: 'nudeln-bio', name: 'Spaghetti Bio' }),
    product({ id: 'leer', name: 'Spaghetti alt' }),
    looseRice,
  ],
  units: [
    unit('nudeln', '2028-01-31'),
    unit('nudeln-bio', '2026-12-10'),
    unit('nudeln-bio', null),
    unit('leer', '2027-01-01', { status: 'consumed' }),
    unit('reis', '2026-11-01'),
  ],
})

describe('getFoodTypeLevel', () => {
  it('gliedert nach Kategorie und bündelt Produkte einer Lebensmittelart zu einer Zeile', async () => {
    const result = await getFoodTypeLevel(reader, { householdId, today, groupKey: 'getreide' })
    if (!result.ok) throw new Error('Warengruppe fehlt')
    const [nudeln, reis] = result.value.categories

    expect(result.value.categories.map((category) => category.name)).toEqual(['Nudeln', 'Reis'])
    expect(nudeln?.rows).toHaveLength(1)
    expect(nudeln?.rows[0]).toMatchObject({
      target: { kind: 'food-type', id: 'art-spaghetti' },
      name: 'Spaghetti',
      packagesInStock: 3,
      state: 'urgent',
      totals: { packages: 3, withoutDate: 1, nextBestBefore: { date: '2026-12-10' } },
    })
    expect(nudeln?.totals.packages).toBe(3)
    expect(reis?.rows[0]).toMatchObject({
      target: { kind: 'product', id: 'reis' },
      name: 'Reis lose',
      packagesInStock: 1,
      state: 'expired',
      totals: { packages: 0, uncountedPackages: 1 },
    })
  })

  it('summiert die Warengruppe über alle Kategorien', async () => {
    const result = await getFoodTypeLevel(reader, { householdId, today, groupKey: 'getreide' })

    expect(result.ok && result.value.group).toMatchObject({
      key: 'getreide',
      totals: { packages: 3, uncountedPackages: 1, amounts: { g: 1500, ml: 0 } },
    })
  })

  it('meldet eine unbekannte Warengruppe als not-found', async () => {
    const result = await getFoodTypeLevel(reader, { householdId, today, groupKey: 'gibt-es-nicht' })

    expect(result).toEqual({ ok: false, error: { kind: 'not-found' } })
  })

  it('zeigt einem fremden Haushalt keine Zeilen', async () => {
    const result = await getFoodTypeLevel(reader, {
      householdId: 'haushalt-b',
      today,
      groupKey: 'getreide',
    })

    expect(result.ok && result.value.categories).toEqual([])
  })
})
