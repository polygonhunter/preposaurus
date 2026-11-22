import { daysBetween, type CalendarDay } from '@/shared/lib/dates'
import { err, ok, type Result } from '@/shared/lib/result'
import type { DateKind } from './unit'

/**
 * Ampel einer Einheit. Sie wird bei jeder Anzeige berechnet und nie gespeichert.
 * „Datum fehlt“ ist ein eigener Zustand ohne Ampelfarbe: Ohne Datum lässt sich weder ein Ablauf
 * behaupten noch Entwarnung geben (#116). Die Einheit landet im Filter „Unvollständig“.
 */
export type UnitState = 'good' | 'soon' | 'urgent' | 'expired' | 'date-missing'

/** Resttage, ab denen eine Einheit gelb (bald fällig) bzw. orange (dringend) wird. */
export interface AmpelThresholds {
  soonDays: number
  urgentDays: number
}

/** Standard laut Konzept: bald fällig bis 3 Monate, dringend bis 4 Wochen. */
export const DEFAULT_AMPEL_THRESHOLDS: AmpelThresholds = { soonDays: 90, urgentDays: 28 }

export type ThresholdError = { kind: 'not-a-whole-number' } | { kind: 'urgent-above-soon' }

interface UnitStateInput {
  /** null heißt „Datum fehlt“ */
  bestBefore: CalendarDay | null
  today: CalendarDay
  thresholds: AmpelThresholds
}

export function unitStateFor({ bestBefore, today, thresholds }: UnitStateInput): UnitState {
  if (bestBefore === null) return 'date-missing'
  const daysLeft = daysBetween(today, bestBefore)
  if (daysLeft < 0) return 'expired'
  if (daysLeft <= thresholds.urgentDays) return 'urgent'
  if (daysLeft <= thresholds.soonDays) return 'soon'
  return 'good'
}

/** Prüft neue Schwellen: ganze Tage ab 0, und orange darf nicht größer sein als gelb. */
export function validateAmpelThresholds(
  thresholds: AmpelThresholds,
): Result<AmpelThresholds, ThresholdError> {
  const values = [thresholds.soonDays, thresholds.urgentDays]
  if (!values.every((value) => Number.isInteger(value) && value >= 0)) {
    return err({ kind: 'not-a-whole-number' })
  }
  if (thresholds.urgentDays > thresholds.soonDays) return err({ kind: 'urgent-above-soon' })
  return ok(thresholds)
}

/**
 * Vorläufige Annahme (UMSETZUNG §7.3): Das Verbrauchsdatum bekommt keine eigene Ampelstufe.
 * Es gilt nur ROT-06: Nach Ablauf gibt es weder den Hinweis „anschauen, riechen, probieren“
 * noch „Noch gut“.
 */
export function canConfirmStillGood(state: UnitState, kind: DateKind): boolean {
  return state === 'expired' && kind === 'best-before'
}
