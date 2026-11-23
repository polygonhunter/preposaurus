// Lese-Repository für Ziel, aktive Quelle und Nachkaufen-Zähler der Übersicht (#67). Jede Abfrage
// filtert auf haushalt_id (#133).
import 'server-only'
import { and, count, eq } from 'drizzle-orm'
import type { Database } from '@/server/db/connection'
import { households } from '@/server/db/schema/household'
import { goals, sources, sourceVersions } from '@/server/db/schema/recommendation'
import { restockItems } from '@/server/db/schema/restock'
import { toCalendarDay } from '@/shared/lib/dates'

async function loadGoal(db: Database, householdId: string) {
  const [row] = await db
    .select({ days: goals.days, targetDate: goals.targetDate })
    .from(goals)
    .where(eq(goals.householdId, householdId))
  if (row === undefined) return null
  return {
    days: row.days,
    targetDay: row.targetDate === null ? null : toCalendarDay(row.targetDate),
  }
}

async function loadActiveSource(db: Database, householdId: string) {
  const [row] = await db
    .select({ name: sources.name, asOf: sourceVersions.asOf, link: sourceVersions.link })
    .from(households)
    .innerJoin(sourceVersions, eq(sourceVersions.id, households.activeSourceVersionId))
    .innerJoin(sources, eq(sources.id, sourceVersions.sourceId))
    .where(eq(households.id, householdId))
  return row ?? null
}

async function countOpenRestockItems(db: Database, householdId: string) {
  const [row] = await db
    .select({ open: count() })
    .from(restockItems)
    .where(and(eq(restockItems.householdId, householdId), eq(restockItems.isDone, false)))
  return row?.open ?? 0
}

export function createHouseholdFactsRepository(db: Database) {
  return {
    loadGoal: (householdId: string) => loadGoal(db, householdId),
    loadActiveSource: (householdId: string) => loadActiveSource(db, householdId),
    countOpenRestockItems: (householdId: string) => countOpenRestockItems(db, householdId),
  }
}
