// Haushalt, Einstellungen, Ziel, Quelle, Mitglieder und Nutzer für den Export (#80). Jede Abfrage
// ist auf den Haushalt gefiltert. Von Nutzern nur Name, Rolle und Status, nie E-Mail oder Hash.
import 'server-only'
import { asc, eq, inArray } from 'drizzle-orm'
import type { Database } from '@/server/db/connection'
import { users } from '@/server/db/schema/account'
import {
  householdSettings,
  households,
  memberAllergies,
  members,
} from '@/server/db/schema/household'
import { goals, sources, sourceVersions } from '@/server/db/schema/recommendation'
import type {
  ExportHousehold,
  ExportMember,
  ExportSettings,
  ExportSource,
  ExportUser,
} from '../domain/household-export'

const toNumber = (value: string | null) => (value === null ? null : Number(value))

async function readSettings(db: Database, householdId: string): Promise<ExportSettings | null> {
  const [row] = await db
    .select({
      defaultDiet: householdSettings.defaultDiet,
      ampelYellowDays: householdSettings.ampelYellowDays,
      ampelOrangeDays: householdSettings.ampelOrangeDays,
      isAiEnabled: householdSettings.isAiEnabled,
      stillGoodCountsAsSupplied: householdSettings.stillGoodCountsAsSupplied,
      weeklySummaryEnabled: householdSettings.weeklySummaryEnabled,
      weeklySummaryWeekday: householdSettings.weeklySummaryWeekday,
      weeklySummaryTime: householdSettings.weeklySummaryTime,
      urgentEnabled: householdSettings.urgentEnabled,
    })
    .from(householdSettings)
    .where(eq(householdSettings.householdId, householdId))
  return row ?? null
}

export async function readExportHousehold(
  db: Database,
  householdId: string,
): Promise<ExportHousehold | null> {
  const [household] = await db
    .select({ name: households.name, calculationMode: households.calculationMode })
    .from(households)
    .where(eq(households.id, householdId))
  if (household === undefined) return null
  const [goal] = await db
    .select({ days: goals.days, targetDate: goals.targetDate })
    .from(goals)
    .where(eq(goals.householdId, householdId))
  return { ...household, settings: await readSettings(db, householdId), goal: goal ?? null }
}

export async function readExportSource(
  db: Database,
  householdId: string,
): Promise<ExportSource | null> {
  const [row] = await db
    .select({
      key: sources.key,
      name: sources.name,
      country: sources.country,
      asOf: sourceVersions.asOf,
      link: sourceVersions.link,
      defaultDays: sourceVersions.defaultDays,
      isVerified: sourceVersions.isVerified,
    })
    .from(households)
    .innerJoin(sourceVersions, eq(sourceVersions.id, households.activeSourceVersionId))
    .innerJoin(sources, eq(sources.id, sourceVersions.sourceId))
    .where(eq(households.id, householdId))
  return row ?? null
}

async function readAllergies(db: Database, memberIds: readonly string[]) {
  if (memberIds.length === 0) return []
  return db
    .select({ memberId: memberAllergies.memberId, label: memberAllergies.label })
    .from(memberAllergies)
    .where(inArray(memberAllergies.memberId, [...memberIds]))
    .orderBy(asc(memberAllergies.label))
}

export async function readExportMembers(
  db: Database,
  householdId: string,
): Promise<ExportMember[]> {
  const rows = await db
    .select({
      id: members.id,
      name: members.name,
      type: members.type,
      birthDate: members.birthDate,
      sex: members.sex,
      activityLevel: members.activityLevel,
      weightKg: members.weightKg,
      condition: members.condition,
      diet: members.diet,
    })
    .from(members)
    .where(eq(members.householdId, householdId))
    .orderBy(asc(members.createdAt))
  const allergies = await readAllergies(
    db,
    rows.map((row) => row.id),
  )
  return rows.map((row) => ({
    ...row,
    weightKg: toNumber(row.weightKg),
    allergies: allergies.filter((entry) => entry.memberId === row.id).map((entry) => entry.label),
  }))
}

export async function readExportUsers(db: Database, householdId: string): Promise<ExportUser[]> {
  return db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.name,
      role: users.role,
      isActive: users.isActive,
      memberId: users.memberId,
    })
    .from(users)
    .where(eq(users.householdId, householdId))
    .orderBy(asc(users.username))
}
