// Kategorien, unter denen eine neue Lebensmittelart entstehen kann (#142, #110): nur sichtbare, in
// der Reihenfolge der Verwaltung. Die Foto-Erkennung bekommt daraus die Namen für den Vorschlag,
// das Erfassen die Auswahl beim Anlegen.
import 'server-only'
import { asc, eq } from 'drizzle-orm'
import type { Database } from '@/server/db/connection'
import { categories } from '@/server/db/schema/catalog'
import { productGroups } from '@/server/db/schema/recommendation'
import type { CategoryChoice } from '../domain/capture-options'
import { isSelectableCategory } from './visible-food-types'

export async function loadCategoryOptions(
  db: Database,
  householdId: string,
): Promise<CategoryChoice[]> {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      productGroupName: productGroups.name,
    })
    .from(categories)
    .innerJoin(productGroups, eq(productGroups.id, categories.productGroupId))
    .where(isSelectableCategory(db, householdId))
    .orderBy(asc(productGroups.sortOrder), asc(categories.sortOrder), asc(categories.name))
}
