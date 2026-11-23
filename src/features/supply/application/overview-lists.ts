// Listen der Übersicht (#69, #70): Bald fällig als Ausschnitt, Abdeckung je Warengruppe und die
// Ziel-Lücke für den Hinweis „Nachkaufen“. Die Zahlen kommen aus `getDueUnits`, `coverageOf` und
// supply/domain, hier wird nur gekürzt und ins DTO übertragen.
import 'server-only'
import { WATER_GROUP_KEY } from '@/features/inventory/application/stock-model'
import type { DueUnits } from '@/features/inventory/schemas'
import { calculateGoalGap } from '../domain/goal-gap'
import { findTightestGroup, type GroupProgress } from '../domain/group-progress'
import type { OverviewDue, OverviewDueEntry, OverviewGroup } from '../schemas'

/** So viele Einträge zeigt die Übersicht, der Rest steht auf „Bald fällig“ (DESIGN_SYSTEM §7). */
const DUE_PREVIEW_SIZE = 3

type DueGroupEntries = DueUnits['groups'][number]

function toDueEntries({ group, entries }: DueGroupEntries): OverviewDueEntry[] {
  return entries.flatMap(({ name, unitIds, bestBefore, daysLeft }) =>
    bestBefore === null || daysLeft === null
      ? []
      : [
          {
            name,
            packages: unitIds.length,
            date: bestBefore.date,
            precision: bestBefore.precision,
            daysLeft,
            group,
          },
        ],
  )
}

/** Zähler je Zeitgruppe und die dringendsten Einträge (Gruppen kommen schon nach Datum sortiert). */
export function duePreview(due: DueUnits): OverviewDue {
  const entries = due.groups.flatMap(toDueEntries).slice(0, DUE_PREVIEW_SIZE)
  const total = Object.values(due.counts).reduce((sum, value) => sum + value, 0)
  return { counts: due.counts, total, entries, soonDays: due.thresholds.soonDays }
}

interface GroupName {
  key: string
  name: string
  shortName: string
}

/** Balken je Warengruppe ohne Wasser, die knappste der gezeigten Gruppen mit Wort markiert. */
export function groupCoverage(
  progress: readonly GroupProgress[],
  groups: readonly GroupName[],
): OverviewGroup[] {
  const shown = progress.filter((entry) => entry.groupKey !== WATER_GROUP_KEY)
  const tightest = findTightestGroup(shown)
  const byKey = new Map(groups.map((group) => [group.key, group]))
  return shown.map(({ groupKey, days, goalDays }) => ({
    key: groupKey,
    name: byKey.get(groupKey)?.name ?? groupKey,
    shortName: byKey.get(groupKey)?.shortName ?? groupKey,
    days,
    goalDays,
    isTightest: groupKey === tightest?.groupKey,
  }))
}

/** Warengruppen mit Lücke bis zum Ziel (A13), für den kurzen Hinweis „Nachkaufen“. */
export function countGapGroups(progressAtTarget: readonly GroupProgress[]): number {
  return calculateGoalGap(progressAtTarget).length
}
