// Repository der Nachkaufen-Liste (#72). Jede Abfrage filtert auf haushalt_id (#133), auch Abhaken
// und Entfernen: Ein fremder Eintrag bleibt unberührt und gilt als „nicht gefunden“.
import 'server-only'
import { and, eq } from 'drizzle-orm'
import type { Database } from '@/server/db/connection'
import { foodTypes } from '@/server/db/schema/food-types'
import { products, units } from '@/server/db/schema/inventory'
import { households } from '@/server/db/schema/household'
import { restockItems } from '@/server/db/schema/restock'
import type { RestockItem } from '../domain/restock-list'

interface NewItem {
  label: string
  source: RestockItem['source']
  productId: string | null
}

interface ProductItem {
  label: string
  productId: string
}

const ownItem = (householdId: string, id: string) =>
  and(eq(restockItems.householdId, householdId), eq(restockItems.id, id))

async function listItems(db: Database, householdId: string): Promise<RestockItem[]> {
  const rows = await db
    .select({
      id: restockItems.id,
      label: restockItems.label,
      source: restockItems.source,
      isDone: restockItems.isDone,
      createdAt: restockItems.createdAt,
      changedAt: restockItems.updatedAt,
    })
    .from(restockItems)
    .where(eq(restockItems.householdId, householdId))
  return rows
}

async function addItem(db: Database, householdId: string, item: NewItem) {
  await db.insert(restockItems).values({ householdId, ...item })
}

async function setDone(db: Database, householdId: string, change: { id: string; isDone: boolean }) {
  const updated = await db
    .update(restockItems)
    .set({ isDone: change.isDone })
    .where(ownItem(householdId, change.id))
    .returning({ id: restockItems.id })
  return updated.length > 0
}

async function removeItem(db: Database, householdId: string, id: string) {
  const removed = await db
    .delete(restockItems)
    .where(ownItem(householdId, id))
    .returning({ id: restockItems.id })
  return removed.length > 0
}

async function hasOpenItemFor(db: Database, householdId: string, productId: string) {
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
async function addProductOnce(db: Database, householdId: string, item: ProductItem) {
  return db.transaction(async (tx) => {
    await tx
      .select({ id: households.id })
      .from(households)
      .where(eq(households.id, householdId))
      .for('update')
    if (await hasOpenItemFor(tx, householdId, item.productId)) return null
    const [added] = await tx
      .insert(restockItems)
      .values({ householdId, ...item, source: 'nachkauf' })
      .returning({ id: restockItems.id })
    return added?.id ?? null
  })
}

// Auf der Liste steht die Lebensmittelart („Linsen“), nicht der Produktname (UX-Konzept §5).
async function findConsumedProduct(db: Database, householdId: string, unitId: string) {
  const [row] = await db
    .select({ productId: products.id, productName: products.name, foodTypeName: foodTypes.name })
    .from(units)
    .innerJoin(products, eq(products.id, units.productId))
    .leftJoin(foodTypes, eq(foodTypes.id, products.foodTypeId))
    .where(and(eq(units.id, unitId), eq(products.householdId, householdId)))
  if (row === undefined) return null
  return { productId: row.productId, label: row.foodTypeName ?? row.productName }
}

export function createRestockRepository(db: Database) {
  return {
    listItems: (householdId: string) => listItems(db, householdId),
    addItem: (householdId: string, item: NewItem) => addItem(db, householdId, item),
    setDone: (householdId: string, change: { id: string; isDone: boolean }) =>
      setDone(db, householdId, change),
    removeItem: (householdId: string, id: string) => removeItem(db, householdId, id),
    addProductOnce: (householdId: string, item: ProductItem) =>
      addProductOnce(db, householdId, item),
    findConsumedProduct: (householdId: string, unitId: string) =>
      findConsumedProduct(db, householdId, unitId),
  }
}
