// Zieldatum des Haushalts (ZIEL-04, 02_HAUSHALT_ZIEL §3). Ein Datum in der Vergangenheit speichert
// die App nicht, sie bittet freundlich um ein neues. Ein schon gespeichertes, inzwischen vergangenes
// Datum bleibt stehen, die Seite fragt dann nach einem neuen (05_STATUS „Zieldatum in der
// Vergangenheit“).
import { daysBetween, type CalendarDay } from '@/shared/lib/dates'

/** Liegt das Zieldatum vor heute? Heute selbst gilt noch. */
export function isTargetDateInPast(targetDate: CalendarDay, today: CalendarDay): boolean {
  return daysBetween(today, targetDate) < 0
}
