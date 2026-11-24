import { daysBetween, type CalendarDay } from '@/shared/lib/dates'
import { err, ok, type Result } from '@/shared/lib/result'
import type { DateKind } from './unit'

/**
 * Ampel einer Einheit. Sie wird bei jeder Anzeige berechnet und nie gespeichert.
 * „Datum fehlt“ ist ein eigener Zustand ohne Ampelfarbe: Ohne Datum lässt sich weder ein Ablauf
 * behaupten noch Entwarnung geben (#116). Die Einheit landet im Filter „Unvollständig“.
 */
export type UnitState = 'good' | 'soon' | 'urgent' | 'expired' | 'no-date'

/** Resttage, ab denen eine Einheit gelb (bald fällig) bzw. orange (dringend) wird. */
export interface AmpelThresholds {
  soonDays: number
  urgentDays: number
}

/**
 * Die Zeitgruppe „Diese Woche“ auf der Seite Bald fällig umfasst fest 7 Tage (UX-Konzept F13).
 * Die Orange-Schwelle darf darunter nicht liegen, sonst überlappen „Diese Woche“ und
 * „Diesen Monat“ (E-21).
 */
export const THIS_WEEK_DAYS = 7

export type ThresholdError =
  { kind: 'not-a-whole-number' } | { kind: 'urgent-below-week' } | { kind: 'urgent-above-soon' }

interface UnitStateInput {
  /** null heißt „Datum fehlt“ */
  bestBefore: CalendarDay | null
  today: CalendarDay
  thresholds: AmpelThresholds
}

export function unitStateFor({ bestBefore, today, thresholds }: UnitStateInput): UnitState {
  if (bestBefore === null) return 'no-date'
  const daysLeft = daysBetween(today, bestBefore)
  if (daysLeft < 0) return 'expired'
  if (daysLeft <= thresholds.urgentDays) return 'urgent'
  if (daysLeft <= thresholds.soonDays) return 'soon'
  return 'good'
}

/** Prüft neue Schwellen: ganze Tage, orange mindestens 7 Tage und nicht größer als gelb. */
export function validateAmpelThresholds(
  thresholds: AmpelThresholds,
): Result<AmpelThresholds, ThresholdError> {
  const values = [thresholds.soonDays, thresholds.urgentDays]
  if (!values.every((value) => Number.isInteger(value) && value >= 0)) {
    return err({ kind: 'not-a-whole-number' })
  }
  if (thresholds.urgentDays < THIS_WEEK_DAYS) return err({ kind: 'urgent-below-week' })
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
