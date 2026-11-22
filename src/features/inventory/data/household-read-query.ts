// Was das Lesen des Vorrats vom Haushalt braucht: Ampel-Schwellen, „Noch gut zählt mit“,
// Mitglieder, Werte der aktiven Quelle und Ziel. Jede Abfrage filtert auf haushalt_id (#133).
import 'server-only'
import { and, asc, eq } from 'drizzle-orm'
import type {
  FilterOptions,
  ReadSettings,
  StockGroup,
} from '@/features/inventory/domain/stock-entry'
import type { NeedsByMemberType } from '@/features/supply/domain/daily-need'
import type { Diet, GroupTarget } from '@/features/supply/domain/group-targets'
import type { SupplyBasis } from '@/features/supply/domain/supply-basis'
import { DEFAULT_AMPEL_ORANGE_DAYS, DEFAULT_AMPEL_YELLOW_DAYS } from '@/shared/config/constants'
import type { Database } from '@/server/db/connection'
import { containers, storageLocations } from '@/server/db/schema/catalog'
import { householdSettings, households, members } from '@/server/db/schema/household'
import { goals, productGroups, sourceNeeds, sourceValues } from '@/server/db/schema/recommendation'
import { toDiet, toMemberType } from './db-values'

const DEFAULT_SETTINGS: ReadSettings = {
  thresholds: { soonDays: DEFAULT_AMPEL_YELLOW_DAYS, urgentDays: DEFAULT_AMPEL_ORANGE_DAYS },
  stillGoodCounts: false,
}

/** Ohne Zeile in haushalt_einstellung gelten die Standardwerte (Schalter aus). */
export async function loadSettings(db: Database, householdId: string): Promise<ReadSettings> {
  const [row] = await db
    .select({
      soonDays: householdSettings.ampelYellowDays,
      urgentDays: householdSettings.ampelOrangeDays,
      stillGoodCounts: householdSettings.stillGoodCountsAsSupplied,
    })
    .from(householdSettings)
    .where(eq(householdSettings.householdId, householdId))
  if (row === undefined) return DEFAULT_SETTINGS
  const { soonDays, urgentDays, stillGoodCounts } = row
  return { thresholds: { soonDays, urgentDays }, stillGoodCounts }
}

async function loadNeeds(db: Database, versionId: string): Promise<NeedsByMemberType> {
  const rows = await db
    .select({
      group: sourceNeeds.personGroup,
      kcal: sourceNeeds.kcalPerDay,
      water: sourceNeeds.waterMlPerDay,
    })
    .from(sourceNeeds)
    .where(eq(sourceNeeds.sourceVersionId, versionId))
  const needs: NeedsByMemberType = {}
  for (const row of rows) {
    needs[toMemberType(row.group)] = { kcalPerDay: Number(row.kcal), waterMlPerDay: row.water }
  }
  return needs
}

async function loadTargets(db: Database, versionId: string) {
  const rows = await db
    .select({
      groupKey: productGroups.key,
      diet: sourceValues.diet,
      amount: sourceValues.amountPerPersonDay,
      unit: sourceValues.unit,
    })
    .from(sourceValues)
    .innerJoin(productGroups, eq(productGroups.id, sourceValues.productGroupId))
    .where(eq(sourceValues.sourceVersionId, versionId))
    .orderBy(asc(productGroups.sortOrder))
  const targets: Partial<Record<Diet, GroupTarget[]>> = {}
  for (const row of rows) {
    const target = {
      groupKey: row.groupKey,
      unit: row.unit,
      amountPerPersonPerDay: Number(row.amount),
    }
    ;(targets[toDiet(row.diet)] ??= []).push(target)
  }
  return targets
}

async function loadHouseholdRow(db: Database, householdId: string) {
  const [row] = await db
    .select({
      versionId: households.activeSourceVersionId,
      diet: householdSettings.defaultDiet,
      goalDays: goals.days,
    })
    .from(households)
    .leftJoin(householdSettings, eq(householdSettings.householdId, households.id))
    .leftJoin(goals, eq(goals.householdId, households.id))
    .where(eq(households.id, householdId))
  return row
}

/** Mitglieder, Bedarf und Zielmengen der aktiven Quelle. Ohne Quelle bleiben beide leer. */
export async function loadSupplyBasis(db: Database, householdId: string): Promise<SupplyBasis> {
  const household = await loadHouseholdRow(db, householdId)
  const memberRows = await db
    .select({ type: members.type, diet: members.diet })
    .from(members)
    .where(eq(members.householdId, householdId))
  const versionId = household?.versionId ?? null
  return {
    members: memberRows.map((row) => ({
      type: toMemberType(row.type),
      diet: row.diet === null ? null : toDiet(row.diet),
    })),
    householdDiet: toDiet(household?.diet ?? 'alles'),
    needs: versionId === null ? {} : await loadNeeds(db, versionId),
    targetsByDiet: versionId === null ? {} : await loadTargets(db, versionId),
    goalDays: household?.goalDays ?? null,
  }
}

/** Warengruppen sind System-Stammdaten ohne Haushalt, deshalb ohne Haushaltsfilter. */
export async function loadGroups(db: Database): Promise<StockGroup[]> {
  return db
    .select({ key: productGroups.key, name: productGroups.name })
    .from(productGroups)
    .orderBy(asc(productGroups.sortOrder))
}

/** Auswahl im Filter-Blatt: alle Behälter, die eigenen, nicht ausgeblendeten Lagerorte. */
export async function loadFilterOptions(db: Database, householdId: string): Promise<FilterOptions> {
  const containerRows = await db
    .select({ id: containers.id, name: containers.name })
    .from(containers)
    .orderBy(asc(containers.sortOrder))
  const locationRows = await db
    .select({ id: storageLocations.id, name: storageLocations.name })
    .from(storageLocations)
    .where(and(eq(storageLocations.householdId, householdId), eq(storageLocations.isHidden, false)))
    .orderBy(asc(storageLocations.sortOrder), asc(storageLocations.name))
  return { containers: containerRows, storageLocations: locationRows }
}
