// Repository der Nachkaufen-Liste (#72). Jede Abfrage filtert auf haushalt_id (#133), auch Abhaken
// und Entfernen: Ein fremder Eintrag bleibt unberührt und gilt als „nicht gefunden“.
import 'server-only'
import { and, count, eq } from 'drizzle-orm'
import type { Database } from '@/server/db/connection'
import { products } from '@/server/db/schema/inventory'
import { restockItems } from '@/server/db/schema/restock'
import type { CalendarDay } from '@/shared/lib/dates'
import type { RestockItem } from '../domain/restock-list'
import { listGroupFoodTypes, listReplacementUnits } from './replacement-queries'
import {
  addProductOnce,
  findConsumedProduct,
  findProduct,
  hasOpenItemFor,
  lockHousehold,
  type ProductItem,
} from './restock-product-queries'

interface NewItem {
  label: string
  source: RestockItem['source']
  productId: string | null
}

interface StoredItem extends NewItem {
  id: string
  isDone: boolean
  createdAt: Date
}

const ownItem = (householdId: string, id: string) =>
  and(eq(restockItems.householdId, householdId), eq(restockItems.id, id))

const storedColumns = {
  id: restockItems.id,
  label: restockItems.label,
  source: restockItems.source,
  productId: restockItems.productId,
  isDone: restockItems.isDone,
  createdAt: restockItems.createdAt,
}

async function listItems(db: Database, householdId: string): Promise<RestockItem[]> {
  return (
    db
      .select({
        ...storedColumns,
        changedAt: restockItems.updatedAt,
        foodTypeId: products.foodTypeId,
      })
      .from(restockItems)
      // Nur Produkte des eigenen Haushalts (#133), auch wenn der Eintrag schon dazugehört
      .leftJoin(
        products,
        and(eq(products.id, restockItems.productId), eq(products.householdId, householdId)),
      )
      .where(eq(restockItems.householdId, householdId))
  )
}

// Offen heißt hier und nur hier: nicht abgehakt. Übersicht und Wochenübersicht zählen damit (#202).
async function countOpenItems(db: Database, householdId: string) {
  const [row] = await db
    .select({ open: count() })
    .from(restockItems)
    .where(and(eq(restockItems.householdId, householdId), eq(restockItems.isDone, false)))
  return row?.open ?? 0
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
  const [removed] = await db
    .delete(restockItems)
    .where(ownItem(householdId, id))
    .returning(storedColumns)
  return removed ?? null
}

// Ein Produkt übernimmt nur, wer es im eigenen Haushalt hat; sonst bleibt der Eintrag ohne Produkt,
// wie nach dem Löschen eines Produkts (on delete set null). Hat jemand das Produkt in den fünf
// Sekunden schon wieder auf die Liste gesetzt, bleibt es bei einem offenen Eintrag (dieselbe Sperre
// wie bei addProductOnce). Eine vergebene ID, auch eine fremde, bleibt unberührt.
async function restoreItem(db: Database, householdId: string, item: StoredItem) {
  await db.transaction(async (tx) => {
    await lockHousehold(tx, householdId)
    const product =
      item.productId === null ? null : await findProduct(tx, householdId, item.productId)
    const productId = product?.productId ?? null
    const isDuplicate =
      productId !== null && !item.isDone && (await hasOpenItemFor(tx, householdId, productId))
    if (isDuplicate) return
    await tx
      .insert(restockItems)
      .values({ householdId, ...item, productId })
      .onConflictDoNothing({ target: restockItems.id })
  })
}

export function createRestockRepository(db: Database) {
  return {
    listItems: (householdId: string) => listItems(db, householdId),
    countOpenItems: (householdId: string) => countOpenItems(db, householdId),
    addItem: (householdId: string, item: NewItem) => addItem(db, householdId, item),
    setDone: (householdId: string, change: { id: string; isDone: boolean }) =>
      setDone(db, householdId, change),
    removeItem: (householdId: string, id: string) => removeItem(db, householdId, id),
    restoreItem: (householdId: string, item: StoredItem) => restoreItem(db, householdId, item),
    addProductOnce: (householdId: string, item: ProductItem) =>
      addProductOnce(db, householdId, item),
    findConsumedProduct: (householdId: string, unitId: string) =>
      findConsumedProduct(db, householdId, unitId),
    findProduct: (householdId: string, productId: string) =>
      findProduct(db, householdId, productId),
    listReplacementUnits: (householdId: string, consumedSince: CalendarDay) =>
      listReplacementUnits(db, householdId, consumedSince),
    listGroupFoodTypes: (householdId: string) => listGroupFoodTypes(db, householdId),
  }
}
