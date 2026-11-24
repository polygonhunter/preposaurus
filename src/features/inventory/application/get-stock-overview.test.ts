import { describe, expect, it } from 'vitest'
import type { SupplyBasis } from '@/features/supply/domain/supply-basis'
import { toCalendarDay } from '@/shared/lib/dates'
import {
  GROUPS,
  SETTINGS,
  createFakeStockReader,
  product,
  unit,
} from '../../../../tests/helpers/fake-stock-reader'
import { getFoodTypeLevel } from './get-food-type-level'
import { getStockOverview } from './get-stock-overview'
import { getStockTree } from './get-stock-tree'

const today = toCalendarDay('2026-11-22')
const householdId = 'haushalt-a'

// TESTDATEN: 1 Erwachsener, 2.000 kcal und 2 l je Tag, Ziel 10 Tage, frei gewählte Zielmengen
const basis: SupplyBasis = {
  members: [{ type: 'adult', diet: null }],
  householdDiet: 'omnivore',
  needs: { adult: { kcalPerDay: 2000, waterMlPerDay: 2000 } },
  targetsByDiet: {
    omnivore: [
      { groupKey: 'getreide', unit: 'g', amountPerPersonPerDay: 150 },
      { groupKey: 'wasser', unit: 'ml', amountPerPersonPerDay: 2000 },
    ],
  },
  goalDays: 10,
}

const water = product({
  id: 'wasser',
  name: 'Mineralwasser',
  content: { value: 1500, unit: 'ml' },
  nutrition: {
    values: { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    source: 'label',
    confirmedAt: null,
  },
  foodType: null,
  category: { id: 'kat-wasser', name: 'Wasser', pictogram: '💧' },
  group: { key: 'wasser', name: 'Wasser', shortName: 'Wasser' },
})

function setup(stillGoodCounts = false) {
  return createFakeStockReader({
    householdId,
    products: [product({ id: 'nudeln' }), water],
    units: [
      unit('nudeln', '2028-01-31'),
      unit('nudeln', '2028-01-31'),
      unit('nudeln', '2026-11-20', { checkedAt: '2026-11-21' }),
      unit('nudeln', '2027-01-01', { status: 'consumed' }),
      unit('wasser', '2028-06-30'),
      unit('wasser', '2028-06-30'),
    ],
    settings: { ...SETTINGS, stillGoodCounts },
    basis,
  })
}

describe('getStockOverview', () => {
  it('liefert jede Warengruppe mit Summen aus calculateNodeTotals, auch leere', async () => {
    const overview = await getStockOverview(setup(), { householdId, today })
    const [getreide, wasser, sonstiges] = overview.groups

    expect(overview.groups.map((group) => group.key)).toEqual(GROUPS.map((group) => group.key))
    expect(getreide?.totals).toMatchObject({
      packages: 2,
      uncountedPackages: 1,
      kcal: 3590,
      amounts: { g: 1000, ml: 0 },
      energyDays: 1.7,
      nextBestBefore: { date: '2028-01-31', precision: 'day', isEstimated: false },
      nextState: 'good',
    })
    expect(wasser?.totals).toMatchObject({ packages: 2, waterDays: 1.5 })
    expect(sonstiges?.totals.packages).toBe(0)
    expect(sonstiges?.coverage).toBeNull()
  })

  it('rechnet die Abdeckung je Warengruppe und markiert die knappste', async () => {
    const overview = await getStockOverview(setup(), { householdId, today })
    const [getreide, wasser] = overview.groups

    expect(overview.goalDays).toBe(10)
    expect(getreide?.coverage).toEqual({
      unit: 'g',
      stock: 1000,
      target: 1500,
      days: 6.6,
      goalDays: 10,
      percent: 66,
      isTightest: false,
    })
    expect(wasser?.coverage).toMatchObject({ days: 1.5, percent: 15, isTightest: true })
  })

  it('nennt im Kopf von Ebene 2 und im Baum dieselbe Abdeckung wie Ebene 1 (#209)', async () => {
    const reader = setup()
    const level = await getFoodTypeLevel(reader, { householdId, today, groupKey: 'getreide' })
    const tree = await getStockTree(reader, { householdId, today })
    const expected = { unit: 'g', stock: 1000, target: 1500, days: 6.6, goalDays: 10, percent: 66 }

    expect(level.ok && level.value.group.coverage).toEqual(expected)
    expect(tree.groups[0]?.group.coverage).toEqual(expected)
    expect(tree.groups.find(({ group }) => group.key === 'sonstiges')?.group.coverage).toBeNull()
  })

  it('zählt „Noch gut“ geprüfte Packungen nur mit eingeschaltetem Schalter', async () => {
    const overview = await getStockOverview(setup(true), { householdId, today })

    expect(overview.groups[0]?.totals).toMatchObject({ packages: 3, uncountedPackages: 0 })
    expect(overview.groups[0]?.coverage?.stock).toBe(1500)
  })

  it('liefert für einen fremden Haushalt nur leere Gruppen ohne Abdeckung', async () => {
    const overview = await getStockOverview(setup(), { householdId: 'haushalt-b', today })

    expect(overview.groups.every((group) => group.totals.packages === 0)).toBe(true)
    expect(overview.groups.every((group) => group.coverage === null)).toBe(true)
    expect(overview.goalDays).toBeNull()
    expect(overview.counts['in-stock']).toBe(0)
  })

  it('zählt die Zustands-Chips aus denselben Packungen im Vorrat (#221)', async () => {
    const overview = await getStockOverview(setup(), { householdId, today })

    // Die „Noch gut“ geprüfte Packung ist entschieden und steht nicht unter „Abgelaufen“
    expect(overview.counts).toEqual({
      'in-stock': 5,
      'due-soon': 0,
      expired: 0,
      incomplete: 0,
    })
  })
})
