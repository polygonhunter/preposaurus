// Ausblenden je Haushalt (#76, #126): eine Zeile in kategorie_ausblendung bzw.
// lebensmittelart_ausblendung. Gilt für System- und eigene Einträge gleich, die Spalte ausgeblendet
// setzt nur der Seed für entfallene System-Einträge.
import 'server-only'
import { and, eq, exists, sql } from 'drizzle-orm'
import type { AnyPgColumn } from 'drizzle-orm/pg-core'
import type { Database } from '@/server/db/connection'
import { hiddenCategories, hiddenFoodTypes } from '@/server/db/schema/catalog-choices'

const asBoolean = (subquery: Parameters<typeof exists>[0]) => sql<boolean>`${exists(subquery)}`

/** Bedingung „der Haushalt hat diese Kategorie ausgeblendet“ für eine Spalte mit der Kategorie-ID */
export const categoryHiddenBy = (db: Database, householdId: string, categoryId: AnyPgColumn) =>
  asBoolean(
    db
      .select({ id: hiddenCategories.id })
      .from(hiddenCategories)
      .where(
        and(
          eq(hiddenCategories.householdId, householdId),
          eq(hiddenCategories.categoryId, categoryId),
        ),
      ),
  )

export const foodTypeHiddenBy = (db: Database, householdId: string, foodTypeId: AnyPgColumn) =>
  asBoolean(
    db
      .select({ id: hiddenFoodTypes.id })
      .from(hiddenFoodTypes)
      .where(
        and(
          eq(hiddenFoodTypes.householdId, householdId),
          eq(hiddenFoodTypes.foodTypeId, foodTypeId),
        ),
      ),
  )

type HideTarget = Readonly<{ householdId: string; id: string; isHidden: boolean }>

export async function setCategoryHidden(db: Database, { householdId, id, isHidden }: HideTarget) {
  if (isHidden) {
    await db.insert(hiddenCategories).values({ householdId, categoryId: id }).onConflictDoNothing()
    return
  }
  await db
    .delete(hiddenCategories)
    .where(and(eq(hiddenCategories.householdId, householdId), eq(hiddenCategories.categoryId, id)))
}

export async function setFoodTypeHidden(db: Database, { householdId, id, isHidden }: HideTarget) {
  if (isHidden) {
    await db.insert(hiddenFoodTypes).values({ householdId, foodTypeId: id }).onConflictDoNothing()
    return
  }
  await db
    .delete(hiddenFoodTypes)
    .where(and(eq(hiddenFoodTypes.householdId, householdId), eq(hiddenFoodTypes.foodTypeId, id)))
}
