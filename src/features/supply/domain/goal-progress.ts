import type { CalendarDay } from '@/shared/lib/dates'
import { err, ok, type Result } from '@/shared/lib/result'
import {
  calculateSupplyDays,
  type SupplyDays,
  type SupplyError,
  type SupplyInput,
  type SupplyUnit,
} from './supply-days'
import { isFreshOn } from './supply-rules'

interface Goal {
  days: number
  targetDay: CalendarDay
}

/** Die beiden Kennzahlen der Übersicht: „Heute versorgt“ und „Ziel <Datum>: X von Y Tagen“. */
export interface GoalProgress<T extends SupplyUnit> {
  today: SupplyDays
  atTarget: SupplyDays
  goalDays: number
  isGoalReached: boolean
  /** Heute haltbar, am Zieldatum nicht mehr: Hinweis „läuft vor Zieldatum ab“ */
  expiringBeforeTarget: T[]
  /** „Datum fehlt“: zählt heute, fürs Ziel nicht, läuft aber nicht nachweislich ab (#116) */
  withoutDate: T[]
}

export type GoalProgressError = SupplyError | { kind: 'target-in-past' }

interface GoalProgressInput<T extends SupplyUnit> extends Omit<SupplyInput, 'reference'> {
  units: readonly T[]
  today: CalendarDay
  goal: Goal
}

/**
 * Einheiten im Vorrat, deren Datum heute noch hält, am Zieldatum aber nicht mehr. Fehlen bewusst:
 * Einheiten ohne Datum (niemand weiß, dass sie ablaufen) und schon abgelaufene „Noch gut“-
 * Packungen, auch wenn sie mit dem Schalter heute zählen (sie laufen nicht erst noch ab).
 */
export function unitsExpiringBefore<T extends SupplyUnit>(
  units: readonly T[],
  period: { today: CalendarDay; targetDay: CalendarDay },
): T[] {
  return units.filter(
    (unit) =>
      unit.status === 'stock' &&
      isFreshOn(unit, period.today) &&
      !isFreshOn(unit, period.targetDay),
  )
}

export function calculateGoalProgress<T extends SupplyUnit>(
  input: GoalProgressInput<T>,
): Result<GoalProgress<T>, GoalProgressError> {
  const { today, goal, ...rest } = input
  if (goal.targetDay < today) return err({ kind: 'target-in-past' })
  const now = calculateSupplyDays({ ...rest, reference: { day: today, kind: 'today' } })
  const atTarget = calculateSupplyDays({
    ...rest,
    reference: { day: goal.targetDay, kind: 'target' },
  })
  if (!now.ok) return now
  if (!atTarget.ok) return atTarget
  return ok({
    today: now.value,
    atTarget: atTarget.value,
    goalDays: goal.days,
    isGoalReached: atTarget.value.days >= goal.days,
    expiringBeforeTarget: unitsExpiringBefore(input.units, { today, targetDay: goal.targetDay }),
    withoutDate: input.units.filter((unit) => unit.status === 'stock' && unit.bestBefore === null),
  })
}
