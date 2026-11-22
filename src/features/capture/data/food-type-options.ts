// Erlaubte Lebensmittelarten für die KI (#110): System-Arten und eigene Arten des Haushalts,
// ohne ausgeblendete Arten und ohne Arten ausgeblendeter Kategorien (#126, #142).
import 'server-only'
import { and, asc, eq, isNull, or } from 'drizzle-orm'
import type { AnyPgColumn } from 'drizzle-orm/pg-core'
import type { Database } from '@/server/db/connection'
import { categories } from '@/server/db/schema/catalog'
import { foodTypes } from '@/server/db/schema/food-types'

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
    .where(
      and(
        ownOrSystem(foodTypes.householdId, householdId),
        eq(foodTypes.isHidden, false),
        eq(categories.isHidden, false),
      ),
    )
    .orderBy(asc(foodTypes.sortOrder), asc(foodTypes.name))
}
