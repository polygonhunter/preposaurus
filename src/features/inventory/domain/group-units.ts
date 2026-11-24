import type { CalendarDay } from '@/shared/lib/dates'
import type { BestBefore, BestBeforePrecision } from './unit'

/** Einheiten mit gleichem Datum, gleicher Genauigkeit und gleichem Schätz-Kennzeichen. */
interface DatedGroup {
  kind: 'dated'
  date: CalendarDay
  precision: BestBeforePrecision
  isEstimated: boolean
  count: number
}

/** Einheiten mit „Datum fehlt“ (#116), eine eigene Gruppe statt eines erfundenen Datums. */
interface NoDateGroup {
  kind: 'no-date'
  count: number
}

export type BestBeforeGroup = DatedGroup | NoDateGroup

const NO_DATE_LABEL = 'Datum fehlt'

const PRECISION_ORDER: Record<BestBeforePrecision, number> = { day: 0, month: 1, year: 2 }

const groupKey = (entry: BestBefore) =>
  `${entry.date}|${entry.precision}|${String(entry.isEstimated)}`

/**
 * Schlüssel der Gruppe, in die ein Datum fällt („Datum fehlt“ bei null). Gleich für die Einheit
 * und ihre Gruppe, damit sich Einheiten in einem Durchlauf zuordnen lassen (#141).
 */
export const bestBeforeKeyOf = (entry: BestBefore | null) =>
  entry === null ? NO_DATE_LABEL : groupKey(entry)

export const groupKeyOf = (group: BestBeforeGroup) =>
  bestBeforeKeyOf(group.kind === 'no-date' ? null : group)

function compareGroups(a: DatedGroup, b: DatedGroup): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1
  if (a.precision !== b.precision)
    return PRECISION_ORDER[a.precision] - PRECISION_ORDER[b.precision]
  return Number(a.isEstimated) - Number(b.isEstimated)
}

/**
 * Fasst gleiche Daten zusammen, nach Datum sortiert, z. B. 09/2027 (6×), 11/2027 (4×).
 * Einheiten ohne Datum (null) stehen gesammelt zuletzt, wie beim Entnehmen (FIFO).
 */
export function groupByBestBefore(entries: readonly (BestBefore | null)[]): BestBeforeGroup[] {
  const groups = new Map<string, DatedGroup>()
  let withoutDate = 0
  for (const entry of entries) {
    if (entry === null) {
      withoutDate += 1
      continue
    }
    const existing = groups.get(groupKey(entry))
    if (existing) existing.count += 1
    else groups.set(groupKey(entry), { kind: 'dated', ...entry, count: 1 })
  }
  const dated: BestBeforeGroup[] = [...groups.values()].sort(compareGroups)
  return withoutDate > 0 ? [...dated, { kind: 'no-date', count: withoutDate }] : dated
}
