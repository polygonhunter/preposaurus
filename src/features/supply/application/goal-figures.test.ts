import { describe, expect, it } from 'vitest'
import type { SupplyBasis } from '@/features/supply/domain/supply-basis'
import { toCalendarDay } from '@/shared/lib/dates'
import { createFakeHouseholdFacts } from '../../../../tests/helpers/fake-household-facts'
import {
  SETTINGS,
  createFakeStockReader,
  product,
  unit,
} from '../../../../tests/helpers/fake-stock-reader'
import { getGoalGaps } from './get-goal-gaps'
import { getGoalStatus } from './get-goal-status'

const today = toCalendarDay('2026-11-22')
const householdId = 'haushalt-a'

// TESTDATEN: 1 Erwachsener, Ziel 10 Tage, frei gewählte Zielmengen (Getreide 1,5 kg, Wasser 20 l)
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
  content: { value: 6000, unit: 'ml' },
  foodType: null,
  category: { id: 'kat-wasser', name: 'Wasser', pictogram: null },
  group: { key: 'wasser', name: 'Wasser' },
})

// Am Zieldatum 01.03.2027 zählen 2 × Nudeln 500 g (die vom 30.12. ist dann abgelaufen, „Datum
// fehlt“ zählt am Zieldatum nicht) und 3 × 6 l Wasser.
const stockUnits = [
  unit('nudeln', '2026-12-30'),
  unit('nudeln', '2028-01-31'),
  unit('nudeln', '2028-01-31'),
  unit('nudeln', null),
  unit('wasser', '2028-06-30'),
  unit('wasser', '2028-06-30'),
  unit('wasser', '2028-06-30'),
]

function ports(goal: { days: number; targetDay: ReturnType<typeof toCalendarDay> | null } | null) {
  return {
    stock: createFakeStockReader({
      householdId,
      products: [product({ id: 'nudeln' }), water],
      units: stockUnits,
      settings: SETTINGS,
      basis: goal === null ? { ...basis, goalDays: null } : basis,
    }),
    facts: createFakeHouseholdFacts({ householdId, goal }),
  }
}

describe('getGoalGaps', () => {
  it('rechnet die Lücke am Zieldatum, Wasser zuerst', async () => {
    const goal = { days: 10, targetDay: toCalendarDay('2027-03-01') }

    const result = await getGoalGaps(ports(goal), { householdId, today })

    expect(result.isCalculable).toBe(true)
    expect(result.gaps.map(({ groupKey, missing }) => ({ groupKey, missing }))).toEqual([
      { groupKey: 'wasser', missing: { value: 2000, unit: 'ml' } },
      { groupKey: 'getreide', missing: { value: 500, unit: 'g' } },
    ])
    expect(result.gaps[0]).toMatchObject({ name: 'Wasser', days: 9, goalDays: 10 })
  })

  it('rechnet ohne Zieldatum mit heute, dann zählt auch „Datum fehlt“', async () => {
    const result = await getGoalGaps(ports({ days: 10, targetDay: null }), { householdId, today })

    // Heute: 4 Nudeln (30.12., 2 × 2028, ohne Datum) = 2 kg, Getreide ist also voll
    expect(result.gaps.map(({ groupKey }) => groupKey)).toEqual(['wasser'])
  })

  it('kann ohne Ziel nichts rechnen', async () => {
    const result = await getGoalGaps(ports(null), { householdId, today })

    expect(result).toEqual({ isCalculable: false, gaps: [] })
  })
})

describe('getGoalStatus', () => {
  it('nennt die Tage am Zieldatum mit Datum', async () => {
    const goal = { days: 10, targetDay: toCalendarDay('2027-03-01') }

    const status = await getGoalStatus(ports(goal), { householdId, today })

    expect(status).toMatchObject({ targetDays: 10, targetDate: '2027-03-01' })
    expect(status?.suppliedDays).toBeGreaterThan(0)
    expect(status?.suppliedDays).toBeLessThan(10)
  })

  it('nennt ohne Zieldatum die Tage heute', async () => {
    const status = await getGoalStatus(ports({ days: 10, targetDay: null }), { householdId, today })

    expect(status).toMatchObject({ targetDays: 10, targetDate: null })
  })

  it('ist null ohne Ziel', async () => {
    expect(await getGoalStatus(ports(null), { householdId, today })).toBeNull()
  })
})
