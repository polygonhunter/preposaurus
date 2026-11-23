// Repository der Nachkaufen-Liste (#72). Jede Abfrage filtert auf haushalt_id (#133), auch Abhaken
// und Entfernen: Ein fremder Eintrag bleibt unberührt und gilt als „nicht gefunden“.
import 'server-only'
import { and, count, eq } from 'drizzle-orm'
import type { Database } from '@/server/db/connection'
import { restockItems } from '@/server/db/schema/restock'
import type { CalendarDay } from '@/shared/lib/dates'
import type { RestockItem } from '../domain/restock-list'
import { listGroupFoodTypes, listReplacementUnits } from './replacement-queries'
import {
  addProductOnce,
  findConsumedProduct,
  findProduct,
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
  return db
    .select({ ...storedColumns, changedAt: restockItems.updatedAt })
    .from(restockItems)
    .where(eq(restockItems.householdId, householdId))
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
// wie nach dem Löschen eines Produkts (on delete set null).
async function restoreItem(db: Database, householdId: string, item: StoredItem) {
  const product =
    item.productId === null ? null : await findProduct(db, householdId, item.productId)
  await db
    .insert(restockItems)
    .values({ householdId, ...item, productId: product?.productId ?? null })
    .onConflictDoNothing({ target: restockItems.id })
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
