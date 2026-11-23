// Produkte mit Packungen und Foto-Verweisen sowie die Nachkaufen-Liste für den Export (#80).
// Jede Abfrage ist auf den Haushalt gefiltert. Von Fotos nur der Verweis, nie der Inhalt, und nur
// feste Fotos (Entwurfsfotos gehören zu einer laufenden Erfassung).
import 'server-only'
import { and, asc, eq } from 'drizzle-orm'
import type { Database } from '@/server/db/connection'
import { photos } from '@/server/db/schema/capture'
import { categories, containers, storageLocations } from '@/server/db/schema/catalog'
import { foodTypes } from '@/server/db/schema/food-types'
import { products, units } from '@/server/db/schema/inventory'
import { restockItems } from '@/server/db/schema/restock'
import type {
  ExportPhoto,
  ExportProduct,
  ExportRestockItem,
  ExportUnit,
} from '../domain/household-export'

const toNumber = (value: string | null) => (value === null ? null : Number(value))
const toIso = (value: Date | null) => (value === null ? null : value.toISOString())

function readProducts(db: Database, householdId: string) {
  return db
    .select({
      id: products.id,
      name: products.name,
      category: categories.name,
      foodType: foodTypes.key,
      container: containers.name,
      storageLocation: storageLocations.name,
      contentAmount: products.contentAmount,
      contentUnit: products.contentUnit,
      drainedWeightG: products.drainedWeightG,
      kcal: products.kcalPer100,
      protein: products.proteinPer100,
      carbs: products.carbsPer100,
      fat: products.fatPer100,
      nutritionSource: products.nutritionSource,
    })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .leftJoin(foodTypes, eq(foodTypes.id, products.foodTypeId))
    .leftJoin(containers, eq(containers.id, products.containerId))
    .leftJoin(storageLocations, eq(storageLocations.id, products.storageLocationId))
    .where(eq(products.householdId, householdId))
    .orderBy(asc(products.name), asc(products.id))
}

type OfProduct<T> = Readonly<{ productId: string | null; item: T }>

async function readUnits(db: Database, householdId: string): Promise<OfProduct<ExportUnit>[]> {
  const rows = await db
    .select({
      productId: units.productId,
      id: units.id,
      bestBefore: units.bestBefore,
      bestBeforePrecision: units.bestBeforePrecision,
      bestBeforeKind: units.bestBeforeKind,
      isBestBeforeEstimated: units.isBestBeforeEstimated,
      status: units.status,
      takenAt: units.takenAt,
      takenBy: units.takenBy,
      checkedAt: units.checkedAt,
      addedAt: units.createdAt,
    })
    .from(units)
    .innerJoin(products, eq(products.id, units.productId))
    .where(eq(products.householdId, householdId))
    .orderBy(asc(units.createdAt), asc(units.id))
  return rows.map(({ productId, ...unit }) => ({
    productId,
    item: { ...unit, takenAt: toIso(unit.takenAt), addedAt: unit.addedAt.toISOString() },
  }))
}

async function readPhotos(db: Database, householdId: string): Promise<OfProduct<ExportPhoto>[]> {
  const rows = await db
    .select({
      productId: photos.productId,
      id: photos.id,
      role: photos.role,
      path: photos.path,
      mimeType: photos.mimeType,
      unitId: photos.unitId,
    })
    .from(photos)
    .where(and(eq(photos.householdId, householdId), eq(photos.status, 'fest')))
    .orderBy(asc(photos.createdAt), asc(photos.id))
  return rows.map(({ productId, ...photo }) => ({ productId, item: photo }))
}

const belongingTo = <T>(rows: readonly OfProduct<T>[], productId: string): T[] =>
  rows.filter((row) => row.productId === productId).map((row) => row.item)

export async function readExportProducts(
  db: Database,
  householdId: string,
): Promise<ExportProduct[]> {
  const [productRows, unitRows, photoRows] = await Promise.all([
    readProducts(db, householdId),
    readUnits(db, householdId),
    readPhotos(db, householdId),
  ])
  return productRows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    foodType: row.foodType,
    container: row.container,
    storageLocation: row.storageLocation,
    content: { amount: Number(row.contentAmount), unit: row.contentUnit },
    drainedWeightG: toNumber(row.drainedWeightG),
    nutritionPer100: {
      kcal: toNumber(row.kcal),
      protein: toNumber(row.protein),
      carbs: toNumber(row.carbs),
      fat: toNumber(row.fat),
    },
    nutritionSource: row.nutritionSource,
    units: belongingTo(unitRows, row.id),
    photos: belongingTo(photoRows, row.id),
  }))
}

export async function readExportRestock(
  db: Database,
  householdId: string,
): Promise<ExportRestockItem[]> {
  const rows = await db
    .select({
      label: restockItems.label,
      amount: restockItems.amount,
      unit: restockItems.unit,
      source: restockItems.source,
      isDone: restockItems.isDone,
      productId: restockItems.productId,
    })
    .from(restockItems)
    .where(eq(restockItems.householdId, householdId))
    .orderBy(asc(restockItems.createdAt))
  return rows.map((row) => ({ ...row, amount: toNumber(row.amount) }))
}
