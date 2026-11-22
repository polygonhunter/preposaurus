import { daysBetween, formatDayWithPrecision, type CalendarDay } from '@/shared/lib/dates'
import type { DueGroup } from '@/features/inventory/domain/due-bundles'
import type { BestBefore } from '@/features/inventory/domain/unit'

// Bausteine für die Texte der Erinnerungen. Ton ruhig und freundlich, keine Angstmache
// (CLAUDE.md). Begriffe wie in der UI: Packung, bald fällig, abgelaufen (UX-Konzept §10).

export type ReminderKind = 'weekly-summary' | 'urgent'

/** Wohin ein Tipp auf die Nachricht führt. Die Adresse legt die Oberfläche fest. */
type ReminderTarget = 'overview' | 'due'

/** Eine fertige Nachricht für Push oder Mail. Jede Zeile ist ein ganzer Satz. */
export interface ReminderMessage {
  kind: ReminderKind
  title: string
  lines: string[]
  target: ReminderTarget
}

/**
 * Ein Eintrag der Seite Bald fällig: Packungen einer Lebensmittelart mit demselben Datum
 * (Bündel aus `bundleDueUnits`). „Datum fehlt“ ist nie ein Eintrag, nur eine Zahl (#116).
 */
export interface DueItem {
  /** Anzeigename, z. B. die Lebensmittelart */
  label: string
  group: DueGroup
  bestBefore: BestBefore
  unitCount: number
  /** Tag, an dem die zuletzt erfasste Packung des Eintrags dazukam */
  latestAddedOn: CalendarDay
}

const MAX_NAMED_ITEMS = 3

/** „1 Packung“, „3 Packungen“ */
export function countWithNoun(count: number, singular: string, plural: string): string {
  return `${String(count)} ${count === 1 ? singular : plural}`
}

export function totalUnits(items: readonly DueItem[]): number {
  return items.reduce((sum, item) => sum + item.unitCount, 0)
}

/** Früheste zuerst, bei gleichem Datum nach Name. */
export function sortByDate(items: readonly DueItem[]): DueItem[] {
  return [...items].sort((a, b) => {
    if (a.bestBefore.date !== b.bestBefore.date)
      return a.bestBefore.date < b.bestBefore.date ? -1 : 1
    return a.label.localeCompare(b.label, 'de')
  })
}

function joinGerman(parts: readonly string[]): string {
  if (parts.length <= 1) return parts.join('')
  return `${parts.slice(0, -1).join(', ')} und ${parts.at(-1) ?? ''}`
}

/** „Thunfisch, Reis und Linsen“ oder „Thunfisch, Reis, Linsen und 2 weitere“, ohne Doppelte. */
export function nameItems(items: readonly DueItem[]): string {
  const names = [...new Set(sortByDate(items).map((item) => item.label))]
  if (names.length <= MAX_NAMED_ITEMS) return joinGerman(names)
  const rest = names.length - MAX_NAMED_ITEMS
  return joinGerman([...names.slice(0, MAX_NAMED_ITEMS), `${String(rest)} weitere`])
}

function describeDaysLeft(daysLeft: number): string {
  if (daysLeft <= 0) return 'läuft heute ab'
  if (daysLeft === 1) return 'läuft morgen ab'
  return `läuft in ${String(daysLeft)} Tagen ab`
}

/**
 * „läuft in 7 Tagen ab“. Ist nur Monat oder Jahr aufgedruckt, nennt der Text das Datum, weil die
 * Tage bis zum Monatsende mehr Genauigkeit vortäuschen würden.
 */
export function describeDue(bestBefore: BestBefore, today: CalendarDay): string {
  const text =
    bestBefore.precision === 'day'
      ? describeDaysLeft(daysBetween(today, bestBefore.date))
      : `hat das Datum ${formatDayWithPrecision(bestBefore)}`
  return bestBefore.isEstimated ? `${text} (Datum geschätzt)` : text
}
