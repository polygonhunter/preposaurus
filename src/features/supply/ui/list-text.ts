// Texte für Bald fällig, Nachkaufen, Warengruppen und Haushalt auf der Übersicht (#69, #70).
// Rein, damit es Tests gibt. Zustand nie nur über Farbe: jede Ampelfarbe hat ihr Wort.
import { formatDayWithPrecision, formatDaysLeft, toCalendarDay } from '@/shared/lib/dates'
import { formatGermanNumber } from '@/shared/lib/quantities'
import type {
  OverviewDue,
  OverviewDueEntry,
  OverviewGoal,
  OverviewGroup,
  OverviewHousehold,
  OverviewRestock,
} from '../schemas'
import { formatDate, formatDays } from './head-text'
import { UNVERIFIED_SOURCE_NOTE } from '@/shared/config/recommendation-source'

type DueGroup = OverviewDueEntry['group']
type StatusTone = 'red' | 'orange' | 'yellow'

/** Zeitgruppen von Bald fällig: Ampelton und Wort (UX-Konzept §8.2). */
export const DUE_BADGE: Record<DueGroup, Readonly<{ tone: StatusTone; label: string }>> = {
  expired: { tone: 'red', label: 'abgelaufen' },
  'this-week': { tone: 'orange', label: 'dringend' },
  'this-month': { tone: 'orange', label: 'dringend' },
  'next-three-months': { tone: 'yellow', label: 'bald fällig' },
}

const DUE_TILE_LABEL: Record<DueGroup, string> = {
  expired: 'abgelaufen',
  'this-week': 'diese Woche',
  'this-month': 'diesen Monat',
  'next-three-months': 'in 3 Monaten',
}

const DUE_TILE_ORDER: readonly DueGroup[] = [
  'expired',
  'this-week',
  'this-month',
  'next-three-months',
]

export function dueTiles(counts: OverviewDue['counts']) {
  return DUE_TILE_ORDER.map((group) => ({
    value: formatGermanNumber(counts[group]),
    label: DUE_TILE_LABEL[group],
  }))
}

/** „4 × Haferdrink“, eine Packung ohne Zahl */
export const dueTitle = ({ name, packages }: OverviewDueEntry) =>
  packages === 1 ? name : `${String(packages)} × ${name}`

/** „04.12.2026 · in 12 Tagen“, ein Monats-MHD als „09/2027“ */
export function dueSubtitle({ date, precision, daysLeft }: OverviewDueEntry): string {
  const printed = formatDayWithPrecision({ date: toCalendarDay(date), precision })
  return `${printed} · ${formatDaysLeft(daysLeft)}`
}

export const nothingDueText = ({ soonDays }: OverviewDue) =>
  `Nichts fällig in den nächsten ${String(soonDays)} Tagen.`

const plural = (count: number, one: string, many: string) =>
  `${formatGermanNumber(count)} ${count === 1 ? one : many}`

/** Kurzer Hinweis „Nachkaufen“, null ohne Daten. */
export function restockText({ openItems, gapGroups }: OverviewRestock): string | null {
  const parts = [
    gapGroups > 0 ? `${plural(gapGroups, 'Warengruppe', 'Warengruppen')} unter dem Ziel` : null,
    openItems > 0 ? `${plural(openItems, 'Eintrag', 'Einträge')} auf der Liste` : null,
  ].filter((part) => part !== null)
  return parts.length === 0 ? null : parts.join(' · ')
}

/** „3 von 10 Tagen“ am Balken einer Warengruppe */
export const coverageText = ({ days, goalDays }: OverviewGroup) =>
  `${formatGermanNumber(days)} von ${String(goalDays)} Tagen`

/** Haushalt knapp: „3 Personen · Ziel 10 Tage bis 01.03.2027“ */
export function householdTitle({ members }: OverviewHousehold, goal: OverviewGoal | null): string {
  const people = members === 0 ? 'Noch niemand eingetragen' : plural(members, 'Person', 'Personen')
  if (goal === null) return people
  const until = goal.date === null ? '' : ` bis ${formatDate(goal.date)}`
  return `${people} · Ziel ${formatDays(goal.days)}${until}`
}

/** „BBK/BLE, Stand 2024“, bei ungeprüften Werten mit dezentem Hinweis */
export function sourceText({ source }: OverviewHousehold): string {
  if (source === null) return 'Noch keine Empfehlung hinterlegt'
  const text = `${source.name}, Stand ${source.asOf}`
  return source.isVerified ? text : `${text} · ${UNVERIFIED_SOURCE_NOTE}`
}
