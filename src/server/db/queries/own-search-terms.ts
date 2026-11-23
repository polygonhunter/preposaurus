// Eigene Suchwörter der Lebensmittelarten eines Haushalts (#126). Gelesen von der Erfassen-Suche
// und von der Verwaltung der Arten, deshalb hier statt in einem Feature.
import 'server-only'
import { asc, eq, inArray } from 'drizzle-orm'
import type { Database } from '../connection'
import { foodTypeSearchTerms } from '../schema/catalog-choices'
import { foodTypes } from '../schema/food-types'

/** Eigene Suchwörter je Art. Nur eigene Arten des Haushalts haben welche. */
export async function loadOwnSearchTerms(
  db: Database,
  householdId: string,
): Promise<Map<string, string[]>> {
  const ownIds = db
    .select({ id: foodTypes.id })
    .from(foodTypes)
    .where(eq(foodTypes.householdId, householdId))
  const rows = await db
    .select({ foodTypeId: foodTypeSearchTerms.foodTypeId, term: foodTypeSearchTerms.term })
    .from(foodTypeSearchTerms)
    .where(inArray(foodTypeSearchTerms.foodTypeId, ownIds))
    .orderBy(asc(foodTypeSearchTerms.term))
  const byFoodType = new Map<string, string[]>()
  for (const row of rows) {
    byFoodType.set(row.foodTypeId, [...(byFoodType.get(row.foodTypeId) ?? []), row.term])
  }
  return byFoodType
}
