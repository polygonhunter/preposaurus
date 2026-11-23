// Produkte auf die Nachkaufen-Liste (#74, #200): nach einer Entnahme oder aus einem Vorschlag unter
// „Ersetzen“. Jede Abfrage filtert auf haushalt_id (#133). Auf der Liste steht die Lebensmittelart
// („Linsen“), nicht der Produktname (UX-Konzept §5).
import 'server-only'
import { and, eq, type SQL } from 'drizzle-orm'
import type { Database } from '@/server/db/connection'
import { foodTypes } from '@/server/db/schema/food-types'
import { households } from '@/server/db/schema/household'
import { products, units } from '@/server/db/schema/inventory'
import { restockItems } from '@/server/db/schema/restock'

export interface ProductItem {
  label: string
  productId: string
}

const productLabel = {
  productId: products.id,
  productName: products.name,
  foodTypeName: foodTypes.name,
}

type LabelRow = Readonly<{ productId: string; productName: string; foodTypeName: string | null }>

const toProductItem = (row: LabelRow | undefined): ProductItem | null =>
  row === undefined
    ? null
    : { productId: row.productId, label: row.foodTypeName ?? row.productName }

async function findProductWhere(db: Database, householdId: string, condition: SQL | undefined) {
  const [row] = await db
    .select(productLabel)
    .from(products)
    .leftJoin(foodTypes, eq(foodTypes.id, products.foodTypeId))
    .where(and(eq(products.householdId, householdId), condition))
  return toProductItem(row)
}

export function findProduct(db: Database, householdId: string, productId: string) {
  return findProductWhere(db, householdId, eq(products.id, productId))
}

export async function findConsumedProduct(db: Database, householdId: string, unitId: string) {
  const [row] = await db
    .select(productLabel)
    .from(units)
    .innerJoin(products, eq(products.id, units.productId))
    .leftJoin(foodTypes, eq(foodTypes.id, products.foodTypeId))
    .where(and(eq(units.id, unitId), eq(products.householdId, householdId)))
  return toProductItem(row)
}

export async function hasOpenItemFor(db: Database, householdId: string, productId: string) {
  const [row] = await db
    .select({ id: restockItems.id })
    .from(restockItems)
    .where(
      and(
        eq(restockItems.householdId, householdId),
        eq(restockItems.productId, productId),
        eq(restockItems.isDone, false),
      ),
    )
    .limit(1)
  return row !== undefined
}

/**
 * Setzt das Produkt nur auf die Liste, wenn es dort noch nicht offen steht. Die Haushaltszeile ist
 * bis zum Ende der Transaktion gesperrt, damit zwei schnelle Tipps auf „Nachkaufen“ nicht beide
 * „noch nicht da“ lesen und zwei Einträge anlegen. Ohne Migration, auf PGlite und PostgreSQL gleich.
 */
export async function lockHousehold(db: Database, householdId: string) {
  await db
    .select({ id: households.id })
    .from(households)
    .where(eq(households.id, householdId))
    .for('update')
}

export async function addProductOnce(db: Database, householdId: string, item: ProductItem) {
  return db.transaction(async (tx) => {
    await lockHousehold(tx, householdId)
    if (await hasOpenItemFor(tx, householdId, item.productId)) return null
    const [added] = await tx
      .insert(restockItems)
      .values({ householdId, ...item, source: 'nachkauf' })
      .returning({ id: restockItems.id })
    return added?.id ?? null
  })
}
