// Texte der Seite „Bald fällig“ (UX-Konzept §8.2). Die Überschriften folgen den Ampel-Schwellen
// aus den Einstellungen: Ändert der Admin sie, ändern sich die Überschriften mit.
import type { DueEntry, DueGroupDto, DueUnits } from '../schemas/due'
import { formatDaysLeft } from '@/shared/lib/dates'
import { expiryHint, formatDate } from './stock-format'

type Thresholds = DueUnits['thresholds']

// Standard-Schwellen, zu denen die Kalenderwörter passen
const MONTH_DAYS = 28
const THREE_MONTHS_DAYS = 90

export function dueGroupTitle(group: DueGroupDto, { urgentDays, soonDays }: Thresholds): string {
  switch (group) {
    case 'expired':
      return 'Abgelaufen'
    case 'this-week':
      return 'Diese Woche'
    case 'this-month':
      return urgentDays === MONTH_DAYS ? 'Diesen Monat' : `In ${String(urgentDays)} Tagen`
    case 'next-three-months':
      return soonDays === THREE_MONTHS_DAYS ? 'In 3 Monaten' : `In ${String(soonDays)} Tagen`
  }
}

/** Kurzer Ton je Gruppe, ohne Angstmache (UX-Konzept §8.2, P12). */
export const DUE_GROUP_TONE: Record<DueGroupDto, string> = {
  expired: 'Bitte kurz anschauen',
  'this-week': 'Diese Woche verbrauchen',
  'this-month': 'Einplanen',
  'next-three-months': 'Im Blick behalten',
}

/** Zähler als Sprungmarke: „2 abgelaufen“, „3 diese Woche“. */
export function dueCounterLabel(group: DueGroupDto, count: number, thresholds: Thresholds) {
  const title = dueGroupTitle(group, thresholds)
  return `${String(count)} ${title.charAt(0).toLowerCase()}${title.slice(1)}`
}

export const dueGroupAnchor = (group: DueGroupDto) => `gruppe-${group}`

/** Titel eines Eintrags: „4 × Haferdrink“, bei einem Produkt mit dessen Bezeichnung. */
export function dueEntryTitle(entry: DueEntry): string {
  const [onlyProduct, ...others] = entry.productNames
  const name = onlyProduct !== undefined && others.length === 0 ? onlyProduct : entry.name
  return `${String(entry.unitIds.length)} × ${name}`
}

/**
 * „04.12.2026 · in 12 Tagen · Keller“. Ein überschrittenes Verbrauchsdatum steht dabei, der
 * MHD-Hinweis dagegen einmal je Gruppe.
 */
export function dueEntryLine(entry: DueEntry): string {
  const isExpired = entry.daysLeft !== null && entry.daysLeft < 0
  const useByHint = isExpired && entry.kind === 'use-by' ? expiryHint('expired', 'use-by') : null
  const parts = [
    entry.bestBefore === null ? null : formatDate(entry.bestBefore),
    entry.daysLeft === null ? null : formatDaysLeft(entry.daysLeft),
    entry.storageLocations.join(', ') || null,
    useByHint,
  ]
  return parts.filter((part) => part !== null).join(' · ')
}
