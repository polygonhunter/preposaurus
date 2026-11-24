import type { CalendarDay } from '@/shared/lib/dates'
import { timeGroupFor, type TimeGroup } from './time-group'
import type { AmpelThresholds } from './unit-state'
import type { BestBefore, DateKind, StockUnit } from './unit'

// Seite Bald fällig (UX-Konzept §8.2, #125): Zeitgruppen aus `timeGroupFor`. „Datum fehlt“ steht
// in keiner Gruppe, nur im Filter „Unvollständig“ (DATENKATALOG A11). Ein Eintrag bündelt die
// Packungen einer Lebensmittelart mit demselben Datum (gleiche Genauigkeit, Schätz-Kennzeichen
// und Datumsart).

export type DueGroup = Exclude<TimeGroup, 'later'>

export const DUE_GROUP_ORDER: readonly DueGroup[] = [
  'expired',
  'this-week',
  'this-month',
  'next-three-months',
]

export interface DueUnit extends Pick<
  StockUnit,
  'id' | 'status' | 'bestBefore' | 'checkedAt' | 'kind'
> {
  /** Wonach gebündelt wird, z. B. die Lebensmittelart der Packung */
  bundleKey: string
}

export interface DueBundle<U extends DueUnit> {
  group: DueGroup
  bundleKey: string
  bestBefore: BestBefore | null
  kind: DateKind
  units: U[]
}

interface DueContext {
  today: CalendarDay
  thresholds: AmpelThresholds
}

/**
 * Gruppe einer Packung auf Bald fällig. null: später fällig, ohne Datum, entschieden („Noch gut“)
 * oder nicht im Vorrat.
 * @internal Läuft nur in `bundleDueUnits`, Tests prüfen die Gruppen je Packung direkt.
 */
export function dueGroupOf(unit: DueUnit, { today, thresholds }: DueContext): DueGroup | null {
  const group = timeGroupFor(unit, today, thresholds)
  return group === null || group === 'later' ? null : group
}

function bundleId(group: DueGroup, unit: DueUnit): string {
  const date = unit.bestBefore
  const datePart = date === null ? '' : `${date.date}|${date.precision}|${String(date.isEstimated)}`
  return `${group}|${unit.bundleKey}|${datePart}|${unit.kind}`
}

function compareBundles<U extends DueUnit>(a: DueBundle<U>, b: DueBundle<U>): number {
  const byGroup = DUE_GROUP_ORDER.indexOf(a.group) - DUE_GROUP_ORDER.indexOf(b.group)
  if (byGroup !== 0) return byGroup
  const dateA = a.bestBefore?.date ?? ''
  const dateB = b.bestBefore?.date ?? ''
  if (dateA !== dateB) return dateA < dateB ? -1 : 1
  return a.bundleKey.localeCompare(b.bundleKey)
}

/** Bündelt fällige Packungen, sortiert nach Gruppe, dann Datum (frühestes zuerst). */
export function bundleDueUnits<U extends DueUnit>(
  units: readonly U[],
  context: DueContext,
): DueBundle<U>[] {
  const bundles = new Map<string, DueBundle<U>>()
  for (const unit of units) {
    const group = dueGroupOf(unit, context)
    if (group === null) continue
    const id = bundleId(group, unit)
    const existing = bundles.get(id)
    if (existing) existing.units.push(unit)
    else {
      const { bundleKey, bestBefore, kind } = unit
      bundles.set(id, { group, bundleKey, bestBefore, kind, units: [unit] })
    }
  }
  return [...bundles.values()].sort(compareBundles)
}
