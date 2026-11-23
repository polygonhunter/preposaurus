// Der Vorrat eines Haushalts, so wie die Erinnerungen ihn brauchen: Einträge von Bald fällig
// (getDueUnits) mit dem Erfassungszeitpunkt der neuesten Packung und die Zahl „Datum fehlt“.
import 'server-only'
import type { GoalStatus } from '@/features/supply/application/get-goal-status'
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

/** Ziel und Nachkaufen für die Wochenübersicht, aus den Use-Cases von supply und restock. */
export interface ReminderGoalFacts {
  loadGoalStatus: (input: { householdId: string; today: CalendarDay }) => Promise<GoalStatus | null>
  countOpenRestockItems: (householdId: string) => Promise<number>
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

type ReminderStock = Pick<WeeklySummaryInput, 'dueItems' | 'missingDateCount'>

/** Bald fällig und „Datum fehlt“, Grundlage für „Dringend“ und die Check-in-Mail. */
export async function loadReminderStock(
  deps: ReminderStockDeps,
  householdId: string,
  today: CalendarDay,
): Promise<ReminderStock> {
  const [dueItems, missingDateCount] = await Promise.all([
    loadDueItems(deps, householdId, today),
    deps.repository.countMissingDates(householdId),
  ])
  return { dueItems, missingDateCount }
}

/**
 * Grundlage der Wochenübersicht: der Vorrat plus Stand des Ziels (wie die Übersicht, M7) und offene
 * Einträge der Nachkaufen-Liste (M8, #186).
 */
export async function loadWeeklySummaryInput(
  deps: ReminderStockDeps & { goals: ReminderGoalFacts },
  householdId: string,
  today: CalendarDay,
): Promise<WeeklySummaryInput> {
  const [stock, goal, openRestockCount] = await Promise.all([
    loadReminderStock(deps, householdId, today),
    deps.goals.loadGoalStatus({ householdId, today }),
    deps.goals.countOpenRestockItems(householdId),
  ])
  return { ...stock, goal, openRestockCount }
}
