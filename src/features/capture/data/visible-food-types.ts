// Welche Lebensmittelarten und Kategorien ein Haushalt neu wählen kann (#126, #142): System- und
// eigene Einträge des Haushalts, ohne Ausgeblendetes. Ausgeblendet ist eine Art, wenn der Seed sie (oder ihre
// Kategorie) ausgeblendet hat oder der Haushalt selbst (kategorie_ausblendung,
// lebensmittelart_ausblendung). Die Abfrage muss die Kategorie der Art schon verknüpfen.
import 'server-only'
import { and, eq, isNull, notExists, or } from 'drizzle-orm'
import type { Database } from '@/server/db/connection'
import { categories } from '@/server/db/schema/catalog'
import { hiddenCategories, hiddenFoodTypes } from '@/server/db/schema/catalog-choices'
import { foodTypes } from '@/server/db/schema/food-types'

/**
 * Kategorie, die der Haushalt wählen kann: System oder eigene, weder vom Seed noch vom Haushalt
 * ausgeblendet. Die Abfrage muss `kategorie` enthalten.
 */
export function isSelectableCategory(db: Database, householdId: string) {
  const hiddenByHousehold = db
    .select({ id: hiddenCategories.id })
    .from(hiddenCategories)
    .where(
      and(
        eq(hiddenCategories.householdId, householdId),
        eq(hiddenCategories.categoryId, categories.id),
      ),
    )
  return and(
    or(isNull(categories.householdId), eq(categories.householdId, householdId)),
    eq(categories.isHidden, false),
    notExists(hiddenByHousehold),
  )
}

export function isSelectableFoodType(db: Database, householdId: string) {
  const hiddenByHousehold = db
    .select({ id: hiddenFoodTypes.id })
    .from(hiddenFoodTypes)
    .where(
      and(
        eq(hiddenFoodTypes.householdId, householdId),
        eq(hiddenFoodTypes.foodTypeId, foodTypes.id),
      ),
    )
  return and(
    or(isNull(foodTypes.householdId), eq(foodTypes.householdId, householdId)),
    eq(foodTypes.isHidden, false),
    notExists(hiddenByHousehold),
    isSelectableCategory(db, householdId),
  )
}
