import type { CalendarDay } from '@/shared/lib/dates'
import { isInStockWithoutDate } from '@/shared/lib/stock-unit'
import { ok, type Result } from '@/shared/lib/result'
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

/** Kennzahlen am Zieldatum: „Ziel <Datum>: X von Y Tagen“. */
interface TargetReachable<T extends SupplyUnit> {
  kind: 'valid'
  atTarget: SupplyDays
  isGoalReached: boolean
  /** Heute haltbar, am Zieldatum nicht mehr: Hinweis „läuft vor Zieldatum ab“ */
  expiringBeforeTarget: T[]
}

/**
 * Das Zieldatum ist vorbei. Kein Fehler: Die Übersicht rechnet ohne Zielzeile weiter, und die UI
 * fragt freundlich nach einem neuen Datum (DATENKATALOG §5 Nr. 14).
 */
interface TargetInPast {
  kind: 'target-in-past'
  targetDay: CalendarDay
}

type TargetOutlook<T extends SupplyUnit> = TargetReachable<T> | TargetInPast

/** Die beiden Kennzahlen der Übersicht: „Heute versorgt“ und der Stand am Zieldatum. */
export interface GoalProgress<T extends SupplyUnit> {
  today: SupplyDays
  goalDays: number
  target: TargetOutlook<T>
  /** „Datum fehlt“: zählt heute, fürs Ziel nicht, läuft aber nicht nachweislich ab (#116) */
  withoutDate: T[]
}

interface GoalProgressInput<T extends SupplyUnit> extends Omit<SupplyInput, 'reference'> {
  units: readonly T[]
  today: CalendarDay
  goal: Goal
}

/**
 * Einheiten im Vorrat, deren Datum heute noch hält, am Zieldatum aber nicht mehr. Fehlen bewusst:
 * Einheiten ohne Datum (niemand weiß, dass sie ablaufen) und schon abgelaufene „Noch gut“-
 * Packungen, auch wenn sie mit dem Schalter heute zählen (sie laufen nicht erst noch ab).
 * @internal Läuft nur in `calculateGoalProgress`, Tests prüfen die Auswahl direkt.
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

function outlookAt<T extends SupplyUnit>(
  input: GoalProgressInput<T>,
): Result<TargetOutlook<T>, SupplyError> {
  const { today, goal, ...rest } = input
  if (goal.targetDay < today) return ok({ kind: 'target-in-past', targetDay: goal.targetDay })
  const atTarget = calculateSupplyDays({
    ...rest,
    reference: { day: goal.targetDay, kind: 'target' },
  })
  if (!atTarget.ok) return atTarget
  return ok({
    kind: 'valid',
    atTarget: atTarget.value,
    isGoalReached: atTarget.value.days >= goal.days,
    expiringBeforeTarget: unitsExpiringBefore(input.units, { today, targetDay: goal.targetDay }),
  })
}

/** Ein Zieldatum in der Vergangenheit ist ein Ergebnis mit Hinweis, kein Fehler. */
export function calculateGoalProgress<T extends SupplyUnit>(
  input: GoalProgressInput<T>,
): Result<GoalProgress<T>, SupplyError> {
  const { today, goal, ...rest } = input
  const now = calculateSupplyDays({ ...rest, reference: { day: today, kind: 'today' } })
  if (!now.ok) return now
  const target = outlookAt(input)
  if (!target.ok) return target
  return ok({
    today: now.value,
    goalDays: goal.days,
    target: target.value,
    withoutDate: input.units.filter(isInStockWithoutDate),
  })
}
