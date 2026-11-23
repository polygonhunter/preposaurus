// Lesen und Schreiben des Speicherns innerhalb einer Transaktion (#51). Jede Abfrage filtert auf
// die haushalt_id. Eigene Stammdaten gelten nur im eigenen Haushalt, System-Einträge überall (#133).
import 'server-only'
import { and, count, eq, isNull, or } from 'drizzle-orm'
import type { Database } from '@/server/db/connection'
import { containers, storageLocations } from '@/server/db/schema/catalog'
import { captures } from '@/server/db/schema/confirmed-captures'
import { foodTypes } from '@/server/db/schema/food-types'
import { products, units } from '@/server/db/schema/inventory'
import type { PlannedNutrition, PlannedUnit } from '../domain/stock-draft'
import type {
  CaptureLookup,
  DraftAdoption,
  FoodTypeRef,
  NewCapture,
  NewProductRow,
  NewUnitRows,
} from '../domain/stock-records'
import {
  DB_CAPTURE_METHOD,
  DB_DATE_KIND,
  DB_NUTRITION_SOURCE,
  DB_PRECISION,
  toNumeric,
} from './db-values'
import { adoptDraft } from './draft-adoption'

async function findCapture(
  tx: Database,
  householdId: string,
  captureId: string,
): Promise<CaptureLookup> {
  const [capture] = await tx
    .select({ householdId: captures.householdId })
    .from(captures)
    .where(eq(captures.id, captureId))
  if (capture === undefined) return { kind: 'none' }
  if (capture.householdId !== householdId) return { kind: 'foreign' }
  const [saved] = await tx
    .select({ productId: units.productId, unitCount: count() })
    .from(units)
    .where(eq(units.captureId, captureId))
    .groupBy(units.productId)
  if (saved === undefined) throw new Error('Erfassung ohne Einheiten')
  return { kind: 'saved', ...saved }
}

const exists = (rows: readonly unknown[]) => rows.length > 0

const NO_NUTRITION = {
  kcalPer100: null,
  proteinPer100: null,
  carbsPer100: null,
  fatPer100: null,
  nutritionSource: null,
  nutritionConfirmedAt: null,
}

export function nutritionColumns(nutrition: PlannedNutrition | null) {
  if (nutrition === null) return NO_NUTRITION
  const { values, source, confirmedAt } = nutrition
  return {
    kcalPer100: toNumeric(values.kcal),
    proteinPer100: toNumeric(values.protein),
    carbsPer100: toNumeric(values.carbs),
    fatPer100: toNumeric(values.fat),
    nutritionSource: DB_NUTRITION_SOURCE[source],
    nutritionConfirmedAt: confirmedAt,
  }
}

async function insertProduct(tx: Database, product: NewProductRow): Promise<string> {
  const [row] = await tx
    .insert(products)
    .values({
      householdId: product.householdId,
      categoryId: product.categoryId,
      foodTypeId: product.foodTypeId,
      containerId: product.containerId,
      storageLocationId: product.storageLocationId,
      name: product.name,
      contentAmount: String(product.content.value),
      contentUnit: product.content.unit,
      drainedWeightG: toNumeric(product.drainedWeightG),
      ...nutritionColumns(product.nutrition),
    })
    .returning({ id: products.id })
  if (row === undefined) throw new Error('Produkt wurde nicht angelegt')
  return row.id
}

function unitColumns({ bestBefore, kind }: PlannedUnit) {
  return {
    bestBefore: bestBefore?.date ?? null,
    bestBeforePrecision: bestBefore === null ? null : DB_PRECISION[bestBefore.precision],
    bestBeforeKind: DB_DATE_KIND[kind],
    isBestBeforeEstimated: bestBefore?.isEstimated ?? false,
  }
}

async function insertUnits(tx: Database, { productId, captureId, units: planned }: NewUnitRows) {
  await tx
    .insert(units)
    .values(planned.map((unit) => ({ productId, captureId, ...unitColumns(unit) })))
}

const ownOrSystemFoodType = (householdId: string) =>
  or(isNull(foodTypes.householdId), eq(foodTypes.householdId, householdId))

async function findFoodType(
  tx: Database,
  householdId: string,
  foodTypeId: string,
): Promise<FoodTypeRef | null> {
  const [row] = await tx
    .select({ id: foodTypes.id, name: foodTypes.name, categoryId: foodTypes.categoryId })
    .from(foodTypes)
    .where(and(eq(foodTypes.id, foodTypeId), ownOrSystemFoodType(householdId)))
  return row ?? null
}

async function claimCapture(tx: Database, capture: NewCapture): Promise<boolean> {
  const rows = await tx
    .insert(captures)
    .values({ ...capture, method: DB_CAPTURE_METHOD[capture.method] })
    .onConflictDoNothing({ target: captures.id })
    .returning({ id: captures.id })
  return exists(rows)
}

/** Eine Zeile mit dieser id, die dem Haushalt gehört (bzw. bei Behältern: die es gibt). */
function createChecks(tx: Database) {
  return {
    hasStorageLocation: async (householdId: string, storageLocationId: string) =>
      exists(
        await tx
          .select({ id: storageLocations.id })
          .from(storageLocations)
          .where(
            and(
              eq(storageLocations.id, storageLocationId),
              eq(storageLocations.householdId, householdId),
            ),
          ),
      ),
    hasContainer: async (containerId: string) =>
      exists(
        await tx
          .select({ id: containers.id })
          .from(containers)
          .where(eq(containers.id, containerId)),
      ),
    hasProduct: async (householdId: string, productId: string) =>
      exists(
        await tx
          .select({ id: products.id })
          .from(products)
          .where(and(eq(products.id, productId), eq(products.householdId, householdId))),
      ),
  }
}

export function createStockTransaction(tx: Database) {
  return {
    ...createChecks(tx),
    findCapture: (householdId: string, captureId: string) =>
      findCapture(tx, householdId, captureId),
    findFoodType: (householdId: string, foodTypeId: string) =>
      findFoodType(tx, householdId, foodTypeId),
    claimCapture: (capture: NewCapture) => claimCapture(tx, capture),
    insertProduct: (product: NewProductRow) => insertProduct(tx, product),
    insertUnits: (rows: NewUnitRows) => insertUnits(tx, rows),
    adoptDraft: (adoption: DraftAdoption) => adoptDraft(tx, adoption),
  }
}
