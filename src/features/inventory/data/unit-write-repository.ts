// Schreib-Repository für Entnahme und Rückgängig (#46). Jedes Update ist bedingt: auf den
// Haushalt (Produkt gehört zu haushalt_id, #133) und auf den Status. So ändert eine doppelte
// Entnahme nur einmal, und eine fremde Packung bleibt unberührt.
import 'server-only'
import { and, eq, inArray } from 'drizzle-orm'
import type { Database } from '@/server/db/connection'
import { products, units } from '@/server/db/schema/inventory'
import { DB_UNIT_STATUS } from './db-values'

interface TakeOutChange {
  unitId: string
  status: 'consumed' | 'discarded'
  userId: string
  at: Date
}

type TakenUnit = Readonly<{ unitId: string; userId: string }>

const ownProductIds = (db: Database, householdId: string) =>
  db.select({ id: products.id }).from(products).where(eq(products.householdId, householdId))

const ownUnit = (db: Database, householdId: string, unitId: string) =>
  and(eq(units.id, unitId), inArray(units.productId, ownProductIds(db, householdId)))

async function statusOf(db: Database, householdId: string, unitId: string) {
  const [row] = await db
    .select({ status: units.status })
    .from(units)
    .where(ownUnit(db, householdId, unitId))
  return row?.status ?? null
}

async function takeOut(db: Database, householdId: string, change: TakeOutChange) {
  const updated = await db
    .update(units)
    .set({ status: DB_UNIT_STATUS[change.status], takenAt: change.at, takenBy: change.userId })
    .where(and(ownUnit(db, householdId, change.unitId), eq(units.status, DB_UNIT_STATUS.stock)))
    .returning({ id: units.id })
  if (updated.length > 0) return 'updated' as const
  return (await statusOf(db, householdId, change.unitId)) === null ? 'not-found' : 'not-in-stock'
}

// Nur die eigene Entnahme: verbraucht und vom selben Nutzer entnommen
const ownConsumption = (db: Database, householdId: string, { unitId, userId }: TakenUnit) =>
  and(
    ownUnit(db, householdId, unitId),
    eq(units.status, DB_UNIT_STATUS.consumed),
    eq(units.takenBy, userId),
  )

async function returnToStock(db: Database, householdId: string, taken: TakenUnit) {
  const updated = await db
    .update(units)
    .set({ status: DB_UNIT_STATUS.stock, takenAt: null, takenBy: null })
    .where(ownConsumption(db, householdId, taken))
    .returning({ id: units.id })
  if (updated.length > 0) return 'updated' as const
  const status = await statusOf(db, householdId, taken.unitId)
  return status === DB_UNIT_STATUS.stock ? 'already-in-stock' : 'not-found'
}

export function createUnitWriteRepository(db: Database) {
  return {
    takeOut: (householdId: string, change: TakeOutChange) => takeOut(db, householdId, change),
    returnToStock: (householdId: string, taken: TakenUnit) => returnToStock(db, householdId, taken),
  }
}
