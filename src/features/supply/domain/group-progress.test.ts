import { describe, expect, expectTypeOf, it } from 'vitest'
import { formatQuantity, type ContentQuantity } from '@/shared/lib/quantities'
import { toCalendarDay } from '@/shared/lib/dates'
import { calculateGoalGap, type GoalGap } from './goal-gap'
import { calculateGroupProgress, findTightestGroup, type GroupUnit } from './group-progress'
import type { HouseholdGroupTarget } from './group-targets'

const today = toCalendarDay('2026-11-22')

// TESTDATEN: Haushaltsziele für 10 Tage, frei gewählt
const targets: HouseholdGroupTarget[] = [
  { groupKey: 'getreide', unit: 'g', amount: 3000 },
  { groupKey: 'gemuese', unit: 'g', amount: 6000 },
  { groupKey: 'fleisch', unit: 'g', amount: 0 },
  { groupKey: 'wasser', unit: 'ml', amount: 40000 },
]

function unit(
  groupKey: string | null,
  amount: number,
  bestBefore: string | null = '2028-01-31',
): GroupUnit {
  return {
    groupKey,
    amount,
    status: 'stock',
    bestBefore:
      bestBefore === null
        ? null
        : { date: toCalendarDay(bestBefore), precision: 'month', isEstimated: false },
    checkedAt: null,
  }
}

const progressFor = (units: GroupUnit[]) =>
  calculateGroupProgress({
    stillGoodCounts: false,
    units,
    targets,
    goalDays: 10,
    reference: { day: today, kind: 'today' },
  })

describe('calculateGroupProgress', () => {
  const units = [
    unit('getreide', 1000),
    unit('getreide', 2600),
    unit('gemuese', 1500),
    unit('wasser', 26000),
    unit('wasser', 6000, '2026-01-31'),
    unit(null, 5000),
  ]
  const progress = progressFor(units)

  it('zeigt je Warengruppe „X von Y Tagen“', () => {
    expect(progress.map((group) => [group.groupKey, group.days, group.goalDays])).toEqual([
      ['getreide', 12, 10],
      ['gemuese', 2.5, 10],
      ['wasser', 6.5, 10],
    ])
  })

  it('zeigt Übererfüllung über 100 %', () => {
    expect(progress[0]).toMatchObject({ stock: 3600, target: 3000, percent: 120 })
  })

  it('nennt die Zielmenge je Tag, aus der die Tage entstehen', () => {
    expect(progress[0]).toMatchObject({ target: 3000, targetPerDay: 300, days: 12 })
  })

  it('lässt Gruppen ohne Ziel weg', () => {
    expect(progress.map((group) => group.groupKey)).not.toContain('fleisch')
  })

  it('zählt abgelaufene Einheiten und solche ohne Warengruppe nicht', () => {
    expect(progress[2]?.stock).toBe(26000)
  })

  it('zeigt eine Gruppe ohne Bestand mit 0 Tagen', () => {
    const empty = progressFor([unit('getreide', 3000)])

    expect(empty.find((group) => group.groupKey === 'gemuese')).toMatchObject({
      stock: 0,
      days: 0,
      percent: 0,
    })
  })

  it('findet die knappste Warengruppe', () => {
    expect(findTightestGroup(progress)?.groupKey).toBe('gemuese')
  })
})

describe('Warengruppen mit „Datum fehlt“', () => {
  const targetDay = toCalendarDay('2027-03-31')
  const units = [unit('getreide', 1500), unit('getreide', 1500, null), unit('wasser', 40000, null)]
  const at = (reference: { day: typeof today; kind: 'today' | 'target' }) =>
    calculateGroupProgress({ stillGoodCounts: false, units, targets, goalDays: 10, reference })

  it('zählen heute im Fortschritt mit', () => {
    const progress = at({ day: today, kind: 'today' })
    expect(progress.map((group) => [group.groupKey, group.stock])).toEqual([
      ['getreide', 3000],
      ['gemuese', 0],
      ['wasser', 40000],
    ])
  })

  it('zählen am Zieldatum nicht und erscheinen dort als Lücke', () => {
    const progress = at({ day: targetDay, kind: 'target' })
    expect(progress.map((group) => [group.groupKey, group.stock])).toEqual([
      ['getreide', 1500],
      ['gemuese', 0],
      ['wasser', 0],
    ])
    expect(calculateGoalGap(progress).map((gap) => formatQuantity(gap.missing))).toEqual([
      '1,5 kg',
      '6 kg',
      '40 l',
    ])
  })
})

describe('findTightestGroup', () => {
  it('nimmt bei Gleichstand die zuerst genannte Gruppe', () => {
    const tied = progressFor([])
    expect(findTightestGroup(tied)?.groupKey).toBe('getreide')
  })

  it('liefert null ohne Gruppen', () => {
    expect(findTightestGroup([])).toBeNull()
  })
})

describe('calculateGoalGap', () => {
  it('nennt Lücken nur in g oder ml, nie in Stück', () => {
    expectTypeOf<GoalGap['missing']>().toEqualTypeOf<ContentQuantity>()
  })

  it('nennt die fehlende Menge je Warengruppe in kg oder l', () => {
    const gaps = calculateGoalGap(progressFor([unit('getreide', 3600), unit('wasser', 26000)]))

    expect(gaps.map((gap) => [gap.groupKey, formatQuantity(gap.missing)])).toEqual([
      ['gemuese', '6 kg'],
      ['wasser', '14 l'],
    ])
  })

  it('lässt Mini-Lücken unter 1 % des Ziels oder unter 1 g bzw. ml weg', () => {
    const gaps = calculateGoalGap(
      progressFor([unit('getreide', 2999.9999999), unit('gemuese', 5950), unit('wasser', 39500)]),
    )
    expect(gaps.map((gap) => gap.groupKey)).toEqual(['wasser'])
  })

  it('lässt eine Lücke von knapp unter 1 g auch bei kleinem Ziel weg', () => {
    const small = calculateGroupProgress({
      stillGoodCounts: false,
      units: [unit('salz', 9.5)],
      targets: [{ groupKey: 'salz', unit: 'g', amount: 10 }],
      goalDays: 10,
      reference: { day: today, kind: 'today' },
    })
    expect(calculateGoalGap(small)).toEqual([])
  })

  it('lässt geschlossene und übererfüllte Gruppen weg', () => {
    const gaps = calculateGoalGap(
      progressFor([unit('getreide', 3000), unit('gemuese', 7000), unit('wasser', 40000)]),
    )
    expect(gaps).toEqual([])
  })
})
