// Datums-Einträge des Erfassens (UX D10, #53): je Datum ein Eintrag mit Anzahl statt „MHD-Serie“
// oder „alle gleich“. „Datum fehlt“ ist ein eigener Eintrag (#116). Hier wird nie ein Datum
// vorgeschlagen oder ergänzt: Ein Eintrag entsteht nur aus einer Eingabe oder der Wahl „Datum fehlt“.
import type { BestBefore } from '@/features/inventory/domain/unit'
import { formatDayWithPrecision } from '@/shared/lib/dates'

export interface DateEntry {
  /** null heißt „Datum fehlt“ */
  bestBefore: BestBefore | null
  count: number
}

const MISSING_DATE_LABEL = 'Datum fehlt'

const MISSING_DATE_KEY = 'fehlt'

/** Gleiches Datum mit gleicher Genauigkeit ist derselbe Eintrag, eine Schätzung bleibt getrennt. */
export function dateEntryKey({ bestBefore }: Pick<DateEntry, 'bestBefore'>): string {
  if (bestBefore === null) return MISSING_DATE_KEY
  const estimated = bestBefore.isEstimated ? ':geschaetzt' : ''
  return `${bestBefore.date}:${bestBefore.precision}${estimated}`
}

/** „30.09.2027“, „09/2027“, „2027“ oder „Datum fehlt“. Eine Schätzung (#124) sagt es dazu. */
export function dateEntryLabel({ bestBefore }: Pick<DateEntry, 'bestBefore'>): string {
  if (bestBefore === null) return MISSING_DATE_LABEL
  const label = formatDayWithPrecision(bestBefore)
  return bestBefore.isEstimated ? `${label} (geschätzt)` : label
}

/** Früheste Daten zuerst, „Datum fehlt“ zuletzt. */
function compareEntries(a: DateEntry, b: DateEntry): number {
  if (a.bestBefore === null) return b.bestBefore === null ? 0 : 1
  if (b.bestBefore === null) return -1
  return a.bestBefore.date.localeCompare(b.bestBefore.date)
}

/** Neues Datum (oder „Datum fehlt“) dazu. Gibt es den Eintrag schon, zählt er eine Packung mehr. */
export function addDateEntry(
  entries: readonly DateEntry[],
  bestBefore: BestBefore | null,
): DateEntry[] {
  const key = dateEntryKey({ bestBefore })
  if (entries.some((entry) => dateEntryKey(entry) === key)) {
    return changeDateCount(entries, { key, delta: 1 })
  }
  return [...entries, { bestBefore, count: 1 }].sort(compareEntries)
}

interface CountChange {
  key: string
  delta: number
}

/** Anzahl ändern. Fällt sie auf 0, verschwindet der Eintrag. */
export function changeDateCount(
  entries: readonly DateEntry[],
  { key, delta }: CountChange,
): DateEntry[] {
  return entries
    .map((entry) =>
      dateEntryKey(entry) === key ? { ...entry, count: entry.count + delta } : entry,
    )
    .filter((entry) => entry.count > 0)
}

export const countPackages = (entries: readonly DateEntry[]) =>
  entries.reduce((sum, entry) => sum + entry.count, 0)
