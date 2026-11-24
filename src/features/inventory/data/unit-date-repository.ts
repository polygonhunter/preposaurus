// Repository für „Datum ändern“ (#49, #116), samt Datumsart (#300). Lesen und Schreiben filtern auf den Haushalt (#133),
// jedes Update zusätzlich auf den Status „Vorrat“: Eine eben entnommene Packung bleibt unberührt.
import 'server-only'
import { and, eq } from 'drizzle-orm'
import type { StockUnit } from '@/features/inventory/domain/unit'
import type { Database } from '@/server/db/connection'
import { foodTypes } from '@/server/db/schema/food-types'
import { products, units } from '@/server/db/schema/inventory'
import { DB_DATE_KIND, DB_PRECISION, DB_UNIT_STATUS } from './db-values'
import { ownUnit } from './own-units'
import { loadUnits } from './stock-units-query'

async function findProductOfUnit(db: Database, householdId: string, unitId: string) {
  const [row] = await db
    .select({
      id: products.id,
      name: products.name,
      foodTypeId: foodTypes.id,
      foodTypeName: foodTypes.name,
    })
    .from(units)
    .innerJoin(products, eq(products.id, units.productId))
    .leftJoin(foodTypes, eq(foodTypes.id, products.foodTypeId))
    .where(and(eq(units.id, unitId), eq(products.householdId, householdId)))
  return row ?? null
}

async function loadSource(db: Database, householdId: string, unitId: string) {
  const product = await findProductOfUnit(db, householdId, unitId)
  if (product === null) return null
  const stockUnits = await loadUnits(db, householdId, {
    productIds: [product.id],
    statuses: ['stock'],
  })
  const { foodTypeId, foodTypeName } = product
  return {
    product: {
      id: product.id,
      name: product.name,
      foodType:
        foodTypeId === null || foodTypeName === null
          ? null
          : { id: foodTypeId, name: foodTypeName },
    },
    stockUnits,
  }
}

const loadStockUnits = (db: Database, householdId: string, unitIds: readonly string[]) =>
  loadUnits(db, householdId, { unitIds, statuses: ['stock'] })

const dateColumns = ({ bestBefore, kind, checkedAt }: StockUnit) => ({
  bestBefore: bestBefore?.date ?? null,
  bestBeforePrecision: bestBefore === null ? null : DB_PRECISION[bestBefore.precision],
  isBestBeforeEstimated: bestBefore?.isEstimated ?? false,
  bestBeforeKind: DB_DATE_KIND[kind],
  checkedAt,
})

async function saveDates(db: Database, householdId: string, changed: readonly StockUnit[]) {
  return db.transaction(async (tx) => {
    let count = 0
    for (const unit of changed) {
      const rows = await tx
        .update(units)
        .set(dateColumns(unit))
        .where(and(ownUnit(tx, householdId, unit.id), eq(units.status, DB_UNIT_STATUS.stock)))
        .returning({ id: units.id })
      count += rows.length
    }
    return count
  })
}

export function createUnitDateRepository(db: Database) {
  return {
    loadSource: (householdId: string, unitId: string) => loadSource(db, householdId, unitId),
    loadStockUnits: (householdId: string, unitIds: readonly string[]) =>
      loadStockUnits(db, householdId, unitIds),
    saveDates: (householdId: string, changed: readonly StockUnit[]) =>
      saveDates(db, householdId, changed),
  }
}
