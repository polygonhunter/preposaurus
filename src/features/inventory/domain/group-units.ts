import { dayParts, type CalendarDay } from '@/shared/lib/dates'
import type { BestBefore, BestBeforePrecision } from './unit'

/** Einheiten mit gleichem Datum, gleicher Genauigkeit und gleichem Schätz-Kennzeichen. */
export interface BestBeforeGroup {
  date: CalendarDay
  precision: BestBeforePrecision
  isEstimated: boolean
  count: number
}

const PRECISION_ORDER: Record<BestBeforePrecision, number> = { day: 0, month: 1, year: 2 }

const pad2 = (value: number) => String(value).padStart(2, '0')

/** MHD so, wie es aufgedruckt war: „30.09.2027“, „09/2027“ oder „2027“. */
export function formatBestBefore({ date, precision }: Omit<BestBefore, 'isEstimated'>): string {
  const { year, month, day } = dayParts(date)
  if (precision === 'year') return String(year)
  if (precision === 'month') return `${pad2(month)}/${String(year)}`
  return `${pad2(day)}.${pad2(month)}.${String(year)}`
}

const groupKey = (entry: BestBefore) =>
  `${entry.date}|${entry.precision}|${String(entry.isEstimated)}`

function compareGroups(a: BestBeforeGroup, b: BestBeforeGroup): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1
  if (a.precision !== b.precision)
    return PRECISION_ORDER[a.precision] - PRECISION_ORDER[b.precision]
  return Number(a.isEstimated) - Number(b.isEstimated)
}

/** Fasst gleiche Daten zusammen, nach Datum sortiert, z. B. 09/2027 (6×), 11/2027 (4×). */
export function groupByBestBefore(entries: readonly BestBefore[]): BestBeforeGroup[] {
  const groups = new Map<string, BestBeforeGroup>()
  for (const entry of entries) {
    const existing = groups.get(groupKey(entry))
    if (existing) existing.count += 1
    else groups.set(groupKey(entry), { ...entry, count: 1 })
  }
  return [...groups.values()].sort(compareGroups)
}

/** „09/2027 (6×)“, ein geschätztes Datum mit Vermerk: „09/2027 (2×, geschätzt)“. */
export function formatBestBeforeGroup(group: BestBeforeGroup): string {
  const estimated = group.isEstimated ? ', geschätzt' : ''
  return `${formatBestBefore(group)} (${String(group.count)}×${estimated})`
}
