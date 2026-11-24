// Erlaubte Lebensmittelarten für die KI (#110): System-Arten und eigene Arten des Haushalts,
// ohne ausgeblendete Arten und ohne Arten ausgeblendeter Kategorien, auch vom Haushalt
// ausgeblendete (#126, #142).
import 'server-only'
import { and, asc, eq, isNull, or } from 'drizzle-orm'
import type { AnyPgColumn } from 'drizzle-orm/pg-core'
import type { Database } from '@/server/db/connection'
import { categories } from '@/server/db/schema/catalog'
import { foodTypes } from '@/server/db/schema/food-types'
import { isSelectableFoodType } from './visible-food-types'

export interface FoodTypeOption {
  key: string
  name: string
}

const ownOrSystem = (column: AnyPgColumn, householdId: string) =>
  or(isNull(column), eq(column, householdId))

export async function loadFoodTypeOptions(
  db: Database,
  householdId: string,
): Promise<FoodTypeOption[]> {
  return db
    .select({ key: foodTypes.key, name: foodTypes.name })
    .from(foodTypes)
    .innerJoin(categories, eq(categories.id, foodTypes.categoryId))
    .where(isSelectableFoodType(db, householdId))
    .orderBy(asc(foodTypes.isSystem), asc(foodTypes.sortOrder), asc(foodTypes.name))
}

/** Eine Art des Haushalts als Grundlage einer Schätzung (#124), sonst null. */
export async function findFoodTypeOption(
  db: Database,
  householdId: string,
  foodTypeId: string,
): Promise<FoodTypeOption | null> {
  const [row] = await db
    .select({ key: foodTypes.key, name: foodTypes.name })
    .from(foodTypes)
    .where(and(eq(foodTypes.id, foodTypeId), ownOrSystem(foodTypes.householdId, householdId)))
  return row ?? null
}
