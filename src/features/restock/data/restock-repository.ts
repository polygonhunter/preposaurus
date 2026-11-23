// Repository der Nachkaufen-Liste (#72). Jede Abfrage filtert auf haushalt_id (#133), auch Abhaken
// und Entfernen: Ein fremder Eintrag bleibt unberührt und gilt als „nicht gefunden“.
import 'server-only'
import { and, count, eq, ne } from 'drizzle-orm'
import type { Database } from '@/server/db/connection'
import { products } from '@/server/db/schema/inventory'
import { productGroups } from '@/server/db/schema/recommendation'
import { restockItems } from '@/server/db/schema/restock'
import type { CalendarDay } from '@/shared/lib/dates'
import type { ContentQuantity } from '@/shared/lib/quantities'
import type { RestockItem } from '../domain/restock-list'
import { removeGapEntry, saveGapEntry } from './goal-entry-queries'
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
  doneAt: Date | null
  createdAt: Date
}

type GapEntry = Parameters<typeof saveGapEntry>[2]

const ownItem = (householdId: string, id: string) =>
  and(eq(restockItems.householdId, householdId), eq(restockItems.id, id))

const OPEN = 'offen'
const DONE = 'erledigt'

const storedColumns = {
  id: restockItems.id,
  label: restockItems.label,
  source: restockItems.source,
  productId: restockItems.productId,
  status: restockItems.status,
  doneAt: restockItems.doneAt,
  createdAt: restockItems.createdAt,
}

type StoredRow = Readonly<{ status: string }> & Omit<StoredItem, 'isDone'>

const toStoredItem = ({ status, ...row }: StoredRow): StoredItem => ({
  ...row,
  isDone: status === DONE,
})

type AmountRow = Readonly<{ amount: string | null; unit: string | null }>

/** Fehlmenge einer Lücke; Stück kommt bei Lücken nicht vor */
function toMissing({ amount, unit }: AmountRow): ContentQuantity | null {
  if (amount === null || (unit !== 'g' && unit !== 'ml')) return null
  return { value: Number(amount), unit }
}

async function listItems(db: Database, householdId: string): Promise<RestockItem[]> {
  const rows = await db
    .select({
      ...storedColumns,
      foodTypeId: products.foodTypeId,
      groupKey: productGroups.key,
      amount: restockItems.amount,
      unit: restockItems.unit,
    })
    .from(restockItems)
    // Nur Produkte des eigenen Haushalts (#133), auch wenn der Eintrag schon dazugehört
    .leftJoin(
      products,
      and(eq(products.id, restockItems.productId), eq(products.householdId, householdId)),
    )
    .leftJoin(productGroups, eq(productGroups.id, restockItems.productGroupId))
    .where(eq(restockItems.householdId, householdId))
  return rows.map(({ amount, unit, ...row }) => ({ ...row, amount: toMissing({ amount, unit }) }))
}

// Offen heißt: weder abgehakt noch ausgeblendet. Übersicht und Wochenübersicht zählen damit (#202).
// Lücken sind nie offen gespeichert und zählen hier deshalb nie mit (#201).
async function countOpenItems(db: Database, householdId: string) {
  const [row] = await db
    .select({ open: count() })
    .from(restockItems)
    .where(and(eq(restockItems.householdId, householdId), eq(restockItems.status, OPEN)))
  return row?.open ?? 0
}

async function addItem(db: Database, householdId: string, item: NewItem) {
  await db.insert(restockItems).values({ householdId, ...item })
}

// Eine abgehakte Lücke wieder öffnen löscht ihren Eintrag; die Lücke ist dann wieder live da.
async function setDone(db: Database, householdId: string, change: { id: string; isDone: boolean }) {
  if (!change.isDone && (await removeGapEntry(db, householdId, change.id))) return true
  const updated = await db
    .update(restockItems)
    .set({ status: change.isDone ? DONE : OPEN, doneAt: change.isDone ? new Date() : null })
    .where(and(ownItem(householdId, change.id), ne(restockItems.source, 'ziel')))
    .returning({ id: restockItems.id })
  return updated.length > 0
}

async function removeItem(db: Database, householdId: string, id: string) {
  const [removed] = await db
    .delete(restockItems)
    .where(ownItem(householdId, id))
    .returning(storedColumns)
  return removed === undefined ? null : toStoredItem(removed)
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
    const { isDone, doneAt, ...rest } = item
    await tx
      .insert(restockItems)
      .values({
        householdId,
        ...rest,
        productId,
        status: isDone ? DONE : OPEN,
        doneAt: isDone ? (doneAt ?? new Date()) : null,
      })
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
    saveGapEntry: (householdId: string, entry: GapEntry) => saveGapEntry(db, householdId, entry),
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
