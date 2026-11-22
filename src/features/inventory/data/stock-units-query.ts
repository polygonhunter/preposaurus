// Einheiten (Packungen) eines Haushalts. Der Join auf produkt filtert auf haushalt_id (#133),
// auch wenn die Produkt-IDs schon aus dem eigenen Haushalt stammen. Die Abfrage nutzt
// einheit_produkt_status_mhd_idx bzw. für Bald fällig den Teilindex einheit_mhd_vorrat_idx.
import 'server-only'
import { and, asc, count, eq, inArray, isNull, lte, or, type SQL } from 'drizzle-orm'
import type { StockProductUnit, UnitQuery } from '@/features/inventory/domain/stock-entry'
import type { UnitStatus } from '@/features/inventory/domain/unit'
import type { Database } from '@/server/db/connection'
import { products, units } from '@/server/db/schema/inventory'
import { DB_UNIT_STATUS, toBestBefore, toDateKind, toDayOrNull, toUnitStatus } from './db-values'

const columns = {
  id: units.id,
  productId: units.productId,
  status: units.status,
  bestBefore: units.bestBefore,
  precision: units.bestBeforePrecision,
  isEstimated: units.isBestBeforeEstimated,
  kind: units.bestBeforeKind,
  checkedAt: units.checkedAt,
}

function productCondition(productIds: readonly string[] | undefined): SQL | undefined {
  return productIds === undefined ? undefined : inArray(units.productId, [...productIds])
}

function dueCondition(query: UnitQuery): SQL | undefined {
  if (query.dueUntil === undefined) return undefined
  return or(lte(units.bestBefore, query.dueUntil), isNull(units.bestBefore))
}

/** Nach MHD sortiert (frühestes zuerst, ohne Datum zuletzt), damit FIFO und Gruppen stabil sind. */
export async function loadUnits(
  db: Database,
  householdId: string,
  query: UnitQuery,
): Promise<StockProductUnit[]> {
  if (query.productIds?.length === 0 || query.statuses.length === 0) return []
  const rows = await db
    .select(columns)
    .from(units)
    .innerJoin(products, eq(products.id, units.productId))
    .where(
      and(
        eq(products.householdId, householdId),
        productCondition(query.productIds),
        inArray(
          units.status,
          query.statuses.map((status) => DB_UNIT_STATUS[status]),
        ),
        dueCondition(query),
      ),
    )
    .orderBy(asc(units.bestBefore), asc(units.id))
  return rows.map((row) => ({
    id: row.id,
    productId: row.productId,
    status: toUnitStatus(row.status),
    bestBefore: toBestBefore(row),
    kind: toDateKind(row.kind),
    checkedAt: toDayOrNull(row.checkedAt),
  }))
}

/** Packungen je Status, z. B. für die Zähler „Verbraucht“ und „Entsorgt“, ohne sie zu laden. */
export async function countUnitsByStatus(
  db: Database,
  householdId: string,
  productIds: readonly string[],
): Promise<Record<UnitStatus, number>> {
  const counts: Record<UnitStatus, number> = { stock: 0, consumed: 0, discarded: 0 }
  if (productIds.length === 0) return counts
  const rows = await db
    .select({ status: units.status, total: count() })
    .from(units)
    .innerJoin(products, eq(products.id, units.productId))
    .where(and(eq(products.householdId, householdId), inArray(units.productId, [...productIds])))
    .groupBy(units.status)
  for (const row of rows) counts[toUnitStatus(row.status)] = row.total
  return counts
}
