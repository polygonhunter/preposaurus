import type { CalendarDay } from '@/shared/lib/dates'
import { err, ok, type Result } from '@/shared/lib/result'
import {
  calculateSupplyDays,
  type SupplyDays,
  type SupplyError,
  type SupplyInput,
  type SupplyUnit,
} from './supply-days'
import { isCountedOn, STILL_GOOD_COUNTS_AS_SUPPLIED } from './supply-rules'

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
}

export type GoalProgressError = SupplyError | { kind: 'target-in-past' }

interface GoalProgressInput<T extends SupplyUnit> extends Omit<SupplyInput, 'referenceDay'> {
  units: readonly T[]
  today: CalendarDay
  goal: Goal
}

/** Einheiten, die heute zählen, am Zieldatum aber nicht mehr. */
export function unitsExpiringBefore<T extends SupplyUnit>(
  units: readonly T[],
  period: { today: CalendarDay; targetDay: CalendarDay },
  stillGoodCounts = STILL_GOOD_COUNTS_AS_SUPPLIED,
): T[] {
  return units.filter(
    (unit) =>
      isCountedOn(unit, period.today, stillGoodCounts) &&
      !isCountedOn(unit, period.targetDay, stillGoodCounts),
  )
}

export function calculateGoalProgress<T extends SupplyUnit>(
  input: GoalProgressInput<T>,
): Result<GoalProgress<T>, GoalProgressError> {
  const { today, goal, ...rest } = input
  if (goal.targetDay < today) return err({ kind: 'target-in-past' })
  const now = calculateSupplyDays({ ...rest, referenceDay: today })
  const atTarget = calculateSupplyDays({ ...rest, referenceDay: goal.targetDay })
  if (!now.ok) return now
  if (!atTarget.ok) return atTarget
  return ok({
    today: now.value,
    atTarget: atTarget.value,
    goalDays: goal.days,
    isGoalReached: atTarget.value.days >= goal.days,
    expiringBeforeTarget: unitsExpiringBefore(
      input.units,
      { today, targetDay: goal.targetDay },
      input.stillGoodCounts,
    ),
  })
}
