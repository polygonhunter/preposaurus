import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import {
  GROUPS,
  createFakeStockReader,
  product,
  reisCategory,
  unit,
} from '../../../../tests/helpers/fake-stock-reader'
import { getFoodTypeLevel } from './get-food-type-level'
import { getStockTree } from './get-stock-tree'

const today = toCalendarDay('2026-11-22')
const householdId = 'haushalt-a'
const sonstiges = { key: 'sonstiges', name: 'Sonstiges', shortName: 'Sonstiges' }

const reader = createFakeStockReader({
  householdId,
  products: [
    product({ id: 'nudeln' }),
    product({ id: 'reis', name: 'Reis lose', foodType: null, category: reisCategory }),
    product({ id: 'honig', name: 'Honig', foodType: null, group: sonstiges }),
    product({ id: 'alt', name: 'Spaghetti alt' }),
  ],
  units: [
    unit('nudeln', '2028-01-31'),
    unit('nudeln', '2026-12-10'),
    unit('reis', '2026-11-01'),
    unit('honig', null),
    unit('alt', '2027-01-01', { status: 'consumed' }),
  ],
})

describe('getStockTree', () => {
  it('liefert jede Warengruppe in der Reihenfolge der Stammdaten, leere mit', async () => {
    const tree = await getStockTree(reader, { householdId, today })

    expect(tree.groups.map(({ group }) => group.key)).toEqual(GROUPS.map(({ key }) => key))
    expect(tree.groups.find(({ group }) => group.key === 'wasser')?.categories).toEqual([])
  })

  it('gliedert jede Warengruppe genau wie Ebene 2', async () => {
    const tree = await getStockTree(reader, { householdId, today })
    const level = await getFoodTypeLevel(reader, { householdId, today, groupKey: 'getreide' })
    if (!level.ok) throw new Error('Warengruppe fehlt')

    expect(tree.groups.find(({ group }) => group.key === 'getreide')).toEqual(level.value)
  })

  it('zählt Summen je Warengruppe nur aus deren Packungen', async () => {
    const tree = await getStockTree(reader, { householdId, today })
    const other = tree.groups.find(({ group }) => group.key === 'sonstiges')

    expect(other?.group.totals).toMatchObject({ packages: 1, withoutDate: 1 })
    expect(other?.categories[0]?.rows.map((row) => row.name)).toEqual(['Honig'])
  })

  it('kennt fremde Haushalte nicht', async () => {
    const tree = await getStockTree(reader, { householdId: 'fremd', today })

    expect(tree.groups.every(({ categories }) => categories.length === 0)).toBe(true)
  })
})
