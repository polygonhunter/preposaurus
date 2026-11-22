// Räumt System-Stammdaten auf, die nicht mehr im Seed stehen (Startliste v2, #128). Nichts, worauf
// ein Produkt oder eine eigene Art zeigt, verschwindet still:
// 1. Wurde eine Art zusammengelegt (MERGED_FOOD_TYPES), ziehen ihre Produkte zur neuen Art um.
// 2. Unbenutzte entfallene Arten und Kategorien werden gelöscht.
// 3. Noch benutzte werden ausgeblendet, statt gelöscht (wie bei System-Kategorien, EIN-04).
// Taucht ein Schlüssel später wieder im Seed auf, bleibt er ausgeblendet, bis ihn jemand einblendet.
import { and, eq, inArray, isNull, notInArray } from 'drizzle-orm'
import type { Database } from '../../src/server/db/connection'
import { categories } from '../../src/server/db/schema/catalog'
import { foodTypes } from '../../src/server/db/schema/food-types'
import { products } from '../../src/server/db/schema/inventory'

type Row = Readonly<{ id: string; key: string }>

async function retiredFoodTypes(db: Database, seededKeys: readonly string[]): Promise<Row[]> {
  return db
    .select({ id: foodTypes.id, key: foodTypes.key })
    .from(foodTypes)
    .where(and(isNull(foodTypes.householdId), notInArray(foodTypes.key, [...seededKeys])))
}

async function moveProducts(db: Database, from: Row, successorKey: string): Promise<void> {
  const [successor] = await db
    .select({ id: foodTypes.id, categoryId: foodTypes.categoryId })
    .from(foodTypes)
    .where(and(isNull(foodTypes.householdId), eq(foodTypes.key, successorKey)))
  if (successor === undefined) throw new Error(`Nachfolger ${successorKey} fehlt im Seed`)
  // Art und Kategorie in einer Anweisung, damit der zusammengesetzte Fremdschlüssel passt.
  await db
    .update(products)
    .set({ foodTypeId: successor.id, categoryId: successor.categoryId })
    .where(eq(products.foodTypeId, from.id))
}

/** Teilt in benutzt und unbenutzt, je nachdem, ob eine der Abfragen die ID liefert. */
async function splitByUse(
  ids: readonly string[],
  findUsed: (ids: string[]) => Promise<readonly (string | null)[]>,
): Promise<{ used: string[]; unused: string[] }> {
  if (ids.length === 0) return { used: [], unused: [] }
  const used = new Set(await findUsed([...ids]))
  return { used: ids.filter((id) => used.has(id)), unused: ids.filter((id) => !used.has(id)) }
}

async function foodTypesInUse(db: Database, ids: string[]): Promise<(string | null)[]> {
  const rows = await db
    .selectDistinct({ id: products.foodTypeId })
    .from(products)
    .where(inArray(products.foodTypeId, ids))
  return rows.map((row) => row.id)
}

export async function retireSystemFoodTypes(
  db: Database,
  seededKeys: readonly string[],
  successors: Readonly<Record<string, string>>,
): Promise<void> {
  const retired = await retiredFoodTypes(db, seededKeys)
  for (const row of retired) {
    const successorKey = successors[row.key]
    if (successorKey !== undefined) await moveProducts(db, row, successorKey)
  }
  const { used, unused } = await splitByUse(
    retired.map((row) => row.id),
    (ids) => foodTypesInUse(db, ids),
  )
  if (unused.length > 0) await db.delete(foodTypes).where(inArray(foodTypes.id, unused))
  if (used.length > 0) {
    await db.update(foodTypes).set({ isHidden: true }).where(inArray(foodTypes.id, used))
  }
}

async function categoriesInUse(db: Database, ids: string[]): Promise<string[]> {
  const byProduct = await db
    .selectDistinct({ id: products.categoryId })
    .from(products)
    .where(inArray(products.categoryId, ids))
  const byFoodType = await db
    .selectDistinct({ id: foodTypes.categoryId })
    .from(foodTypes)
    .where(inArray(foodTypes.categoryId, ids))
  return [...byProduct, ...byFoodType].map((row) => row.id)
}

export async function retireSystemCategories(
  db: Database,
  seededKeys: readonly string[],
): Promise<void> {
  const retired = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(isNull(categories.householdId), notInArray(categories.key, [...seededKeys])))
  const { used, unused } = await splitByUse(
    retired.map((row) => row.id),
    (ids) => categoriesInUse(db, ids),
  )
  if (unused.length > 0) await db.delete(categories).where(inArray(categories.id, unused))
  if (used.length > 0) {
    await db.update(categories).set({ isHidden: true }).where(inArray(categories.id, used))
  }
}
