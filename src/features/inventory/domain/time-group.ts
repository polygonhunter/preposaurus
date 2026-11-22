import { daysBetween, type CalendarDay } from '@/shared/lib/dates'
import type { StockUnit } from './unit'
import { THIS_WEEK_DAYS, type AmpelThresholds } from './unit-state'

/**
 * Zeitgruppen der Seite Bald fällig (UX-Konzept §5, DATENKATALOG A11): Abgelaufen, Diese Woche
 * (fest 7 Tage), Diesen Monat (bis zur Orange-Schwelle), In 3 Monaten (bis zur Gelb-Schwelle).
 * Alles danach ist „später“ und steht nicht auf der Seite.
 */
export type TimeGroup = 'expired' | 'this-week' | 'this-month' | 'next-three-months' | 'later'

type TimeGroupUnit = Pick<StockUnit, 'status' | 'bestBefore' | 'checkedAt'>

function groupForDaysLeft(daysLeft: number, thresholds: AmpelThresholds): TimeGroup {
  if (daysLeft < 0) return 'expired'
  if (daysLeft <= THIS_WEEK_DAYS) return 'this-week'
  if (daysLeft <= thresholds.urgentDays) return 'this-month'
  if (daysLeft <= thresholds.soonDays) return 'next-three-months'
  return 'later'
}

/**
 * Zeitgruppe einer Packung, gezählt in Tagen von heute bis zum MHD. Keine Gruppe (null) haben:
 * Packungen, die nicht mehr im Vorrat sind, „Datum fehlt“ (nur Filter „Unvollständig“) und
 * abgelaufene, „Noch gut“ geprüfte Packungen. Sie sind entschieden und verlassen „Abgelaufen“.
 */
export function timeGroupFor(
  unit: TimeGroupUnit,
  today: CalendarDay,
  thresholds: AmpelThresholds,
): TimeGroup | null {
  if (unit.status !== 'stock' || unit.bestBefore === null) return null
  const group = groupForDaysLeft(daysBetween(today, unit.bestBefore.date), thresholds)
  if (group === 'expired' && unit.checkedAt !== null) return null
  return group
}
