// Datums-Einträge des Erfassens (UX D10, #53): je Datum ein Eintrag mit Anzahl statt „MHD-Serie“
// oder „alle gleich“. „Datum fehlt“ ist ein eigener Eintrag (#116). Hier wird nie ein Datum
// vorgeschlagen oder ergänzt: Ein Eintrag entsteht nur aus einer Eingabe oder der Wahl „Datum fehlt“.
// Ein Verbrauchsdatum (#294) bleibt ein eigener Eintrag und sagt es im Text dazu.
import type { BestBefore, DateKind } from '@/features/inventory/domain/unit'
import { formatDayWithPrecision } from '@/shared/lib/dates'

export interface DateEntry {
  /** null heißt „Datum fehlt“ */
  bestBefore: BestBefore | null
  count: number
  /** Ohne Angabe gilt es als MHD (Standard der Datumsart) */
  kind?: DateKind | undefined
}

const MISSING_DATE_LABEL = 'Datum fehlt'

const MISSING_DATE_KEY = 'fehlt'

const USE_BY_NOTE = 'Verbrauchsdatum'

/** Gleiches Datum mit gleicher Genauigkeit ist derselbe Eintrag, eine Schätzung bleibt getrennt. */
export function dateEntryKey({ bestBefore, kind }: Pick<DateEntry, 'bestBefore' | 'kind'>): string {
  const useBy = kind === 'use-by' ? ':verbrauchen' : ''
  if (bestBefore === null) return `${MISSING_DATE_KEY}${useBy}`
  const estimated = bestBefore.isEstimated ? ':geschaetzt' : ''
  return `${bestBefore.date}:${bestBefore.precision}${estimated}${useBy}`
}

/**
 * „30.09.2027“, „09/2027“, „2027“ oder „Datum fehlt“. Eine Schätzung (#124) und ein
 * Verbrauchsdatum (#294) sagen es dazu.
 */
export function dateEntryLabel({ bestBefore, kind }: Pick<DateEntry, 'bestBefore' | 'kind'>) {
  const date = bestBefore === null ? MISSING_DATE_LABEL : formatDayWithPrecision(bestBefore)
  const notes = [
    bestBefore?.isEstimated === true && 'geschätzt',
    kind === 'use-by' && USE_BY_NOTE,
  ].filter((note) => note !== false)
  return notes.length === 0 ? date : `${date} (${notes.join(', ')})`
}

/** Früheste Daten zuerst, „Datum fehlt“ zuletzt. */
function compareEntries(a: DateEntry, b: DateEntry): number {
  if (a.bestBefore === null) return b.bestBefore === null ? 0 : 1
  if (b.bestBefore === null) return -1
  return a.bestBefore.date.localeCompare(b.bestBefore.date)
}

/**
 * Neues Datum (oder „Datum fehlt“) dazu, ohne `kind` als MHD. Gibt es den Eintrag schon, zählt er
 * eine Packung mehr.
 */
export function addDateEntry(
  entries: readonly DateEntry[],
  bestBefore: BestBefore | null,
  kind?: DateKind,
): DateEntry[] {
  const key = dateEntryKey({ bestBefore, kind })
  if (entries.some((entry) => dateEntryKey(entry) === key)) {
    return changeDateCount(entries, { key, delta: 1 })
  }
  return [...entries, { bestBefore, count: 1, kind }].sort(compareEntries)
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

interface KindChange {
  key: string
  kind: DateKind
}

/**
 * Datumsart eines Eintrags umschalten (#294). Gibt es dasselbe Datum schon mit der neuen Art,
 * werden beide ein Eintrag und die Anzahl addiert, wie beim erneuten Hinzufügen.
 */
export function changeDateKind(entries: readonly DateEntry[], { key, kind }: KindChange) {
  const entry = entries.find((candidate) => dateEntryKey(candidate) === key)
  if (entry === undefined) return [...entries]
  const nextKey = dateEntryKey({ ...entry, kind })
  if (nextKey === key) return [...entries]
  const others = entries.filter((candidate) => candidate !== entry)
  const twin = others.find((candidate) => dateEntryKey(candidate) === nextKey)
  if (twin === undefined) {
    return entries.map((candidate) => (candidate === entry ? { ...entry, kind } : candidate))
  }
  return others.map((candidate) =>
    candidate === twin ? { ...twin, count: twin.count + entry.count } : candidate,
  )
}

export const countPackages = (entries: readonly DateEntry[]) =>
  entries.reduce((sum, entry) => sum + entry.count, 0)
