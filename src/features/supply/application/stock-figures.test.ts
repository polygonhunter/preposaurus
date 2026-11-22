import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import type { GroupUnit } from '../domain/group-progress'
import type { SupplyBasis } from '../domain/supply-basis'
import { coverageOf, dailyNeedOf } from './stock-figures'

const today = toCalendarDay('2026-11-22')

// TESTDATEN: frei gewählte Mengen je Person und Tag, nicht die geprüften Quellwerte
const basis: SupplyBasis = {
  members: [
    { type: 'adult', diet: null },
    { type: 'child', diet: 'vegetarian' },
    { type: 'baby', diet: null },
  ],
  householdDiet: 'omnivore',
  needs: {
    adult: { kcalPerDay: 2000, waterMlPerDay: 2000 },
    child: { kcalPerDay: 1500, waterMlPerDay: 1500 },
  },
  targetsByDiet: {
    omnivore: [
      { groupKey: 'getreide', unit: 'g', amountPerPersonPerDay: 100 },
      { groupKey: 'fleisch', unit: 'g', amountPerPersonPerDay: 50 },
    ],
    vegetarian: [
      { groupKey: 'getreide', unit: 'g', amountPerPersonPerDay: 120 },
      { groupKey: 'fleisch', unit: 'g', amountPerPersonPerDay: 0 },
    ],
  },
  goalDays: 10,
}

const grain = (amount: number): GroupUnit => ({
  status: 'stock',
  bestBefore: { date: toCalendarDay('2028-01-31'), precision: 'day', isEstimated: false },
  checkedAt: null,
  groupKey: 'getreide',
  amount,
})

describe('dailyNeedOf', () => {
  it('summiert den Bedarf, das Baby zählt nicht mit', () => {
    expect(dailyNeedOf(basis)).toEqual({ kcalPerDay: 3500, waterMlPerDay: 3500 })
  })
})

describe('coverageOf', () => {
  it('rechnet die Zielmenge je Person nach ihrer Ernährungsform', () => {
    const { progress, tightestGroupKey } = coverageOf({
      basis,
      units: [grain(1100)],
      today,
      stillGoodCounts: false,
    })

    expect(progress.map((entry) => [entry.groupKey, entry.target, entry.days])).toEqual([
      ['getreide', 2200, 5],
      ['fleisch', 500, 0],
    ])
    expect(tightestGroupKey).toBe('fleisch')
  })

  it('nimmt „alles“, wenn für eine Ernährungsform keine Werte vorliegen', () => {
    const vegan = { ...basis, members: [{ type: 'adult' as const, diet: 'vegan' as const }] }
    const { progress } = coverageOf({ basis: vegan, units: [], today, stillGoodCounts: false })

    expect(progress.map((entry) => entry.target)).toEqual([1000, 500])
  })

  it('bleibt ohne Ziel leer', () => {
    const coverage = coverageOf({
      basis: { ...basis, goalDays: null },
      units: [grain(500)],
      today,
      stillGoodCounts: false,
    })

    expect(coverage).toEqual({ progress: [], tightestGroupKey: null })
  })
})
