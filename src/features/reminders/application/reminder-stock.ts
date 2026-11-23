// Der Vorrat eines Haushalts, so wie die Erinnerungen ihn brauchen: Einträge von Bald fällig
// (getDueUnits) mit dem Erfassungszeitpunkt der neuesten Packung und die Zahl „Datum fehlt“.
import 'server-only'
import { getDueUnits } from '@/features/inventory/application/get-due-units'
import type { StockReader } from '@/features/inventory/application/stock-reader'
import type { DueGroup } from '@/features/inventory/domain/due-bundles'
import type { DueEntry, DueUnits } from '@/features/inventory/schemas'
import { toCalendarDay, type CalendarDay } from '@/shared/lib/dates'
import type { DueItem } from '../domain/message'
import type { WeeklySummaryInput } from '../domain/weekly-summary'
import type { ReminderRepository } from './reminder-repository'

export interface ReminderStockDeps {
  reader: StockReader
  repository: Pick<ReminderRepository, 'loadAddedTimes' | 'countMissingDates'>
}

// „In 3 Monaten“ ist noch weit weg und kommt in keiner Erinnerung vor.
const REMINDER_GROUPS: ReadonlySet<DueGroup> = new Set(['expired', 'this-week', 'this-month'])
const NEVER = new Date(0)

function latestAddedAt(unitIds: readonly string[], addedTimes: ReadonlyMap<string, Date>): Date {
  return unitIds.reduce((latest, id) => {
    const addedAt = addedTimes.get(id)
    return addedAt !== undefined && addedAt > latest ? addedAt : latest
  }, NEVER)
}

function toDueItem(group: DueGroup, entry: DueEntry, addedTimes: ReadonlyMap<string, Date>) {
  if (entry.bestBefore === null) return []
  const item: DueItem = {
    label: entry.name,
    group,
    bestBefore: { ...entry.bestBefore, date: toCalendarDay(entry.bestBefore.date) },
    unitCount: entry.unitIds.length,
    latestAddedAt: latestAddedAt(entry.unitIds, addedTimes),
  }
  return [item]
}

const reminderGroups = (due: DueUnits) =>
  due.groups.filter(({ group }) => REMINDER_GROUPS.has(group))

async function loadDueItems(deps: ReminderStockDeps, householdId: string, today: CalendarDay) {
  const due = await getDueUnits(deps.reader, { householdId, today, sort: 'date' })
  const groups = reminderGroups(due)
  const unitIds = groups.flatMap(({ entries }) => entries.flatMap((entry) => entry.unitIds))
  const addedTimes = await deps.repository.loadAddedTimes(householdId, unitIds)
  return groups.flatMap(({ group, entries }) =>
    entries.flatMap((entry) => toDueItem(group, entry, addedTimes)),
  )
}

/**
 * Grundlage für Wochenübersicht und „Dringend“. Ziel und Nachkaufen fehlen noch: Die Übersicht
 * (M7) und die Nachkaufen-Liste (M8) liefern sie, sobald es ihre Use-Cases gibt (#186).
 */
export async function loadReminderStock(
  deps: ReminderStockDeps,
  householdId: string,
  today: CalendarDay,
): Promise<WeeklySummaryInput> {
  const [dueItems, missingDateCount] = await Promise.all([
    loadDueItems(deps, householdId, today),
    deps.repository.countMissingDates(householdId),
  ])
  return { dueItems, missingDateCount, goal: null, openRestockCount: 0 }
}
