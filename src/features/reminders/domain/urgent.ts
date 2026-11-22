import { addDays, todayInBerlin, type CalendarDay } from '@/shared/lib/dates'
import {
  countWithNoun,
  describeDue,
  nameItems,
  sortByDate,
  totalUnits,
  type DueItem,
  type ReminderMessage,
} from './message'

// „Dringend“ (ERI-03): die Gruppe „Diese Woche“ von Bald fällig, gebündelt in einer Nachricht.
// Gemeldet wird nur, was seit dem letzten Versand neu dazukam (SCHNITTSTELLEN Nr. 27), damit
// dieselbe Packung nicht jeden Tag erneut erscheint.

/**
 * Breite der Gruppe „Diese Woche“ in Tagen. Gleicher Wert wie `THIS_WEEK_DAYS` in
 * `inventory/domain/unit-state.ts`. domain/ darf zwischen Features nur Typen teilen, deshalb hält
 * ein Test in `tests/integration/db/ampel-check.test.ts` beide gleich.
 */
export const URGENT_WINDOW_DAYS = 7

interface NewSinceInput {
  /** Zeitpunkt des letzten Versands, null, wenn noch nie gesendet */
  lastSentAt: Date | null
}

/**
 * Neu ist ein Eintrag, wenn er beim letzten Versand noch nicht in „Diese Woche“ lag oder seither
 * eine Packung dazukam. Der Zeitpunkt statt des Tages zählt, damit eine Packung, die am Tag des
 * Versands erst danach erfasst wurde, nicht verloren geht.
 */
function isNewSince(item: DueItem, { lastSentAt }: NewSinceInput): boolean {
  if (lastSentAt === null) return true
  const lastWindowEnd = addDays(todayInBerlin(lastSentAt), URGENT_WINDOW_DAYS)
  return item.bestBefore.date > lastWindowEnd || item.latestAddedAt > lastSentAt
}

/** Einträge für „Dringend“: nur „Diese Woche“ und nur Neues seit dem letzten Versand. */
export function selectNewUrgentItems(items: readonly DueItem[], context: NewSinceInput): DueItem[] {
  return items.filter((item) => item.group === 'this-week' && isNewSince(item, context))
}

function singleLine(item: DueItem, today: CalendarDay): string {
  const amount = item.unitCount > 1 ? ` (${String(item.unitCount)} Packungen)` : ''
  return `${item.label}${amount} ${describeDue(item.bestBefore, today)}.`
}

function bundledLines(items: readonly DueItem[], today: CalendarDay): string[] {
  const [first] = sortByDate(items)
  const count = countWithNoun(totalUnits(items), 'Packung', 'Packungen')
  const lines = [`${count} diese Woche verbrauchen: ${nameItems(items)}.`]
  if (first) lines.push(`Als Erstes: ${singleLine(first, today)}`)
  return lines
}

/** Eine Nachricht für alle neuen Einträge, null, wenn nichts Neues dabei ist. */
export function buildUrgentMessage(
  items: readonly DueItem[],
  today: CalendarDay,
): ReminderMessage | null {
  const [only] = items
  if (only === undefined) return null
  const lines = items.length === 1 ? [singleLine(only, today)] : bundledLines(items, today)
  return { kind: 'urgent', title: 'Bald verbrauchen', lines, target: 'due' }
}
