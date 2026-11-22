import type { CalendarDay } from '@/shared/lib/dates'
import type { HouseholdGroupTarget } from './group-targets'
import {
  isCountedOn,
  roundDownDays,
  STILL_GOOD_COUNTS_AS_SUPPLIED,
  type CountableUnit,
} from './supply-rules'

/** Eine Einheit mit ihrer Warengruppe und ihrer Menge in g oder ml. */
export interface GroupUnit extends CountableUnit {
  groupKey: string | null
  amount: number
}

/** Balken je Warengruppe: „X von Y Tagen“. */
export interface GroupProgress {
  groupKey: string
  unit: 'g' | 'ml'
  stock: number
  target: number
  days: number
  goalDays: number
  /** Über 100 heißt übererfüllt */
  percent: number
}

interface GroupProgressInput {
  units: readonly GroupUnit[]
  targets: readonly HouseholdGroupTarget[]
  goalDays: number
  referenceDay: CalendarDay
  stillGoodCounts?: boolean
}

const PERCENT = 100

function stockByGroup(input: GroupProgressInput): Map<string, number> {
  const stillGoodCounts = input.stillGoodCounts ?? STILL_GOOD_COUNTS_AS_SUPPLIED
  const stock = new Map<string, number>()
  for (const unit of input.units) {
    if (unit.groupKey === null || !isCountedOn(unit, input.referenceDay, stillGoodCounts)) continue
    stock.set(unit.groupKey, (stock.get(unit.groupKey) ?? 0) + unit.amount)
  }
  return stock
}

/** Je Warengruppe mit Ziel: Bestand am Stichtag gegen Zielmenge. Gruppen ohne Ziel entfallen. */
export function calculateGroupProgress(input: GroupProgressInput): GroupProgress[] {
  const stock = stockByGroup(input)
  return input.targets
    .filter((target) => target.amount > 0)
    .map(({ groupKey, unit, amount: target }) => {
      const current = stock.get(groupKey) ?? 0
      return {
        groupKey,
        unit,
        stock: current,
        target,
        days: roundDownDays((current / target) * input.goalDays),
        goalDays: input.goalDays,
        percent: Math.floor((current / target) * PERCENT),
      }
    })
}

/** Die knappste Warengruppe (kleinste Tage), bei Gleichstand die zuerst genannte. */
export function findTightestGroup(progress: readonly GroupProgress[]): GroupProgress | null {
  let tightest: GroupProgress | null = null
  for (const group of progress) {
    if (tightest === null || group.days < tightest.days) tightest = group
  }
  return tightest
}
