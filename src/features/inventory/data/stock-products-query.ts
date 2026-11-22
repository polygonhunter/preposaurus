// Produkte eines Haushalts mit ganzem Pfad im Baum, in einer Abfrage (kein N+1). Gefiltert wird
// immer auf haushalt_id (#133, CODE_PRINZIPIEN §8). Eigene Kategorien, Arten und Lagerorte werden
// nur verknüpft, wenn sie demselben Haushalt gehören oder System-Einträge sind: Ein fehlerhafter
// Bezug auf fremde Stammdaten zeigt so nichts aus dem anderen Haushalt.
import 'server-only'
import { and, asc, eq, ilike, isNull, or, type SQL } from 'drizzle-orm'
import type { AnyPgColumn } from 'drizzle-orm/pg-core'
import type { ProductFilter, StockProduct } from '@/features/inventory/domain/stock-entry'
import type { Database } from '@/server/db/connection'
import { categories, containers, storageLocations } from '@/server/db/schema/catalog'
import { foodTypes } from '@/server/db/schema/food-types'
import { products } from '@/server/db/schema/inventory'
import { productGroups } from '@/server/db/schema/recommendation'
import { toNumberOrNull, toNutritionSource } from './db-values'
import { isAnyOf } from './id-list'

const ownOrSystem = (column: AnyPgColumn, householdId: string) =>
  or(isNull(column), eq(column, householdId))

// % und _ sind in LIKE Platzhalter. Eine Suche nach „50%“ meint das Zeichen selbst.
const escapeLike = (text: string) => text.replace(/[\\%_]/g, (match) => `\\${match}`)

function searchCondition(search: string | undefined): SQL | undefined {
  const trimmed = search?.trim() ?? ''
  if (trimmed === '') return undefined
  const pattern = `%${escapeLike(trimmed)}%`
  return or(ilike(products.name, pattern), ilike(foodTypes.name, pattern))
}

function filterConditions(householdId: string, filter: ProductFilter): (SQL | undefined)[] {
  const equals = (column: AnyPgColumn, value: string | undefined) =>
    value === undefined ? undefined : eq(column, value)
  return [
    eq(products.householdId, householdId),
    equals(productGroups.key, filter.groupKey),
    equals(products.categoryId, filter.categoryId),
    equals(products.foodTypeId, filter.foodTypeId),
    equals(products.id, filter.productId),
    filter.productIds === undefined ? undefined : isAnyOf(products.id, filter.productIds),
    equals(products.containerId, filter.containerId),
    equals(products.storageLocationId, filter.storageLocationId),
    searchCondition(filter.search),
  ]
}

const columns = {
  id: products.id,
  name: products.name,
  contentAmount: products.contentAmount,
  contentUnit: products.contentUnit,
  kcal: products.kcalPer100,
  protein: products.proteinPer100,
  carbs: products.carbsPer100,
  fat: products.fatPer100,
  nutritionSource: products.nutritionSource,
  nutritionConfirmedAt: products.nutritionConfirmedAt,
  categoryId: categories.id,
  categoryName: categories.name,
  categoryPictogram: categories.pictogram,
  groupKey: productGroups.key,
  groupName: productGroups.name,
  foodTypeId: foodTypes.id,
  foodTypeName: foodTypes.name,
  foodTypeKcal: foodTypes.kcalPer100,
  foodTypeProtein: foodTypes.proteinPer100,
  foodTypeCarbs: foodTypes.carbsPer100,
  foodTypeFat: foodTypes.fatPer100,
  shelfLifeMonths: foodTypes.typicalShelfLifeMonths,
  containerId: containers.id,
  containerName: containers.name,
  locationId: storageLocations.id,
  locationName: storageLocations.name,
}

function selectProducts(db: Database, householdId: string, filter: ProductFilter) {
  return db
    .select(columns)
    .from(products)
    .innerJoin(
      categories,
      and(eq(categories.id, products.categoryId), ownOrSystem(categories.householdId, householdId)),
    )
    .innerJoin(productGroups, eq(productGroups.id, categories.productGroupId))
    .leftJoin(
      foodTypes,
      and(eq(foodTypes.id, products.foodTypeId), ownOrSystem(foodTypes.householdId, householdId)),
    )
    .leftJoin(containers, eq(containers.id, products.containerId))
    .leftJoin(
      storageLocations,
      and(
        eq(storageLocations.id, products.storageLocationId),
        eq(storageLocations.householdId, householdId),
      ),
    )
    .where(and(...filterConditions(householdId, filter)))
    .orderBy(
      asc(productGroups.sortOrder),
      asc(categories.sortOrder),
      asc(categories.name),
      asc(foodTypes.sortOrder),
      asc(foodTypes.name),
      asc(products.name),
      asc(products.id),
    )
}

type ProductRow = Awaited<ReturnType<typeof selectProducts>>[number]

function refOrNull(id: string | null, name: string | null) {
  return id === null || name === null ? null : { id, name }
}

function toFoodType(row: ProductRow): StockProduct['foodType'] {
  if (row.foodTypeId === null || row.foodTypeName === null) return null
  return {
    id: row.foodTypeId,
    name: row.foodTypeName,
    reference: {
      kcal: toNumberOrNull(row.foodTypeKcal),
      protein: toNumberOrNull(row.foodTypeProtein),
      carbs: toNumberOrNull(row.foodTypeCarbs),
      fat: toNumberOrNull(row.foodTypeFat),
    },
    typicalShelfLifeMonths: row.shelfLifeMonths,
  }
}

function toStockProduct(row: ProductRow): StockProduct {
  return {
    id: row.id,
    name: row.name,
    content: { value: Number(row.contentAmount), unit: row.contentUnit },
    nutrition: {
      values: {
        kcal: toNumberOrNull(row.kcal),
        protein: toNumberOrNull(row.protein),
        carbs: toNumberOrNull(row.carbs),
        fat: toNumberOrNull(row.fat),
      },
      source: toNutritionSource(row.nutritionSource),
      confirmedAt: row.nutritionConfirmedAt,
    },
    foodType: toFoodType(row),
    category: { id: row.categoryId, name: row.categoryName, pictogram: row.categoryPictogram },
    group: { key: row.groupKey, name: row.groupName },
    container: refOrNull(row.containerId, row.containerName),
    storageLocation: refOrNull(row.locationId, row.locationName),
  }
}

/** Sortiert wie der Baum: Warengruppe, Kategorie, Lebensmittelart, dann Bezeichnung. */
export async function loadProducts(
  db: Database,
  householdId: string,
  filter: ProductFilter,
): Promise<StockProduct[]> {
  if (filter.productIds?.length === 0) return []
  const rows = await selectProducts(db, householdId, filter)
  return rows.map(toStockProduct)
}
