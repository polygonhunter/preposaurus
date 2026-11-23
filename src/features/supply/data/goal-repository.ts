// Ziel und Empfehlungsquelle eines Haushalts (ZIEL-01, ZIEL-03, ZIEL-04). Die Quelle ist die vom
// Haushalt genutzte Fassung (haushalt.aktive_quelle_version_id) mit Name, Stand und Link. Jede
// Abfrage filtert auf den Haushalt.
import 'server-only'
import { eq } from 'drizzle-orm'
import type { Database } from '@/server/db/connection'
import { households } from '@/server/db/schema/household'
import { goals, sources, sourceVersions } from '@/server/db/schema/recommendation'
import { toCalendarDay, type CalendarDay } from '@/shared/lib/dates'

export type RecommendationSource = Readonly<{
  name: string
  asOf: string
  link: string
  defaultDays: number
  isVerified: boolean
}>

type StoredGoal = Readonly<{
  /** null, solange der Haushalt noch kein Ziel hat */
  days: number | null
  targetDate: CalendarDay | null
  source: RecommendationSource | null
}>

type GoalValues = Readonly<{ days: number; targetDate: CalendarDay | null }>

export interface GoalRepository {
  read: (householdId: string) => Promise<StoredGoal>
  save: (householdId: string, goal: GoalValues) => Promise<void>
}

async function readGoal(db: Database, householdId: string): Promise<StoredGoal> {
  const [row] = await db
    .select({
      days: goals.days,
      targetDate: goals.targetDate,
      sourceName: sources.name,
      asOf: sourceVersions.asOf,
      link: sourceVersions.link,
      defaultDays: sourceVersions.defaultDays,
      isVerified: sourceVersions.isVerified,
    })
    .from(households)
    .leftJoin(goals, eq(goals.householdId, households.id))
    .leftJoin(sourceVersions, eq(sourceVersions.id, households.activeSourceVersionId))
    .leftJoin(sources, eq(sources.id, sourceVersions.sourceId))
    .where(eq(households.id, householdId))
  if (row === undefined) return { days: null, targetDate: null, source: null }
  const { sourceName, asOf, link, defaultDays, isVerified } = row
  const hasSource = sourceName !== null && asOf !== null && link !== null && defaultDays !== null
  return {
    days: row.days,
    targetDate: row.targetDate === null ? null : toCalendarDay(row.targetDate),
    source: hasSource
      ? { name: sourceName, asOf, link, defaultDays, isVerified: isVerified === true }
      : null,
  }
}

export function createGoalRepository(db: Database): GoalRepository {
  return {
    read: (householdId) => readGoal(db, householdId),
    async save(householdId, { days, targetDate }) {
      await db
        .insert(goals)
        .values({ householdId, days, targetDate })
        .onConflictDoUpdate({ target: goals.householdId, set: { days, targetDate } })
    },
  }
}
