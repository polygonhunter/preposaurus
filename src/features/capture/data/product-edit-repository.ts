// Repository für „Angaben bearbeiten“ (#49). Lesen und Ändern filtern auf die haushalt_id (#133).
// Die Prüfung der Stammdaten teilt es mit dem Speichern einer Erfassung (stock-transaction).
import 'server-only'
import { and, eq } from 'drizzle-orm'
import type { StoredNutritionSource } from '@/features/inventory/domain/nutrition-source'
import type { Database } from '@/server/db/connection'
import { products } from '@/server/db/schema/inventory'
import type { EditableProduct, ProductChange } from '../domain/product-edit-records'
import { DB_NUTRITION_SOURCE } from './db-values'
import { createStockTransaction, nutritionColumns } from './stock-transaction'

const ownProduct = (householdId: string, productId: string) =>
  and(eq(products.id, productId), eq(products.householdId, householdId))

const SOURCE_OF_DB = new Map(
  Object.entries(DB_NUTRITION_SOURCE).map(([source, dbValue]) => [
    dbValue,
    source as StoredNutritionSource,
  ]),
)

const numberOrNull = (value: string | null) => (value === null ? null : Number(value))

async function findProduct(
  db: Database,
  householdId: string,
  productId: string,
): Promise<EditableProduct | null> {
  const [row] = await db.select().from(products).where(ownProduct(householdId, productId))
  if (row === undefined) return null
  return {
    id: row.id,
    name: row.name,
    foodTypeId: row.foodTypeId,
    content: { value: Number(row.contentAmount), unit: row.contentUnit },
    containerId: row.containerId,
    storageLocationId: row.storageLocationId,
    nutrition: {
      values: {
        kcal: numberOrNull(row.kcalPer100),
        protein: numberOrNull(row.proteinPer100),
        carbs: numberOrNull(row.carbsPer100),
        fat: numberOrNull(row.fatPer100),
      },
      source: row.nutritionSource === null ? null : (SOURCE_OF_DB.get(row.nutritionSource) ?? null),
      confirmedAt: row.nutritionConfirmedAt,
    },
  }
}

async function updateProduct(db: Database, householdId: string, change: ProductChange) {
  const { values, source, confirmedAt } = change.nutrition
  const rows = await db
    .update(products)
    .set({
      categoryId: change.categoryId,
      foodTypeId: change.foodTypeId,
      name: change.name,
      contentAmount: String(change.content.value),
      contentUnit: change.content.unit,
      containerId: change.containerId,
      storageLocationId: change.storageLocationId,
      ...nutritionColumns(source === null ? null : { values, source, confirmedAt }),
    })
    .where(ownProduct(householdId, change.id))
    .returning({ id: products.id })
  return rows.length > 0
}

export function createProductEditRepository(db: Database) {
  const checks = createStockTransaction(db)
  return {
    findProduct: (householdId: string, productId: string) =>
      findProduct(db, householdId, productId),
    findFoodType: checks.findFoodType,
    hasContainer: checks.hasContainer,
    hasStorageLocation: checks.hasStorageLocation,
    updateProduct: (householdId: string, change: ProductChange) =>
      updateProduct(db, householdId, change),
  }
}
