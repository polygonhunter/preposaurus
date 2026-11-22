// Schreib-Repository für Entnahme und Rückgängig (#46). Jedes Update ist bedingt: auf den
// Haushalt (Produkt gehört zu haushalt_id, #133) und auf den Status. So ändert eine doppelte
// Entnahme nur einmal, und eine fremde Packung bleibt unberührt.
import 'server-only'
import { and, eq, inArray, ne } from 'drizzle-orm'
import type { Database } from '@/server/db/connection'
import { products, units } from '@/server/db/schema/inventory'
import { DB_UNIT_STATUS } from './db-values'

interface TakeOutChange {
  unitId: string
  status: 'consumed' | 'discarded'
  userId: string | null
  at: Date
}

const ownProductIds = (db: Database, householdId: string) =>
  db.select({ id: products.id }).from(products).where(eq(products.householdId, householdId))

const ownUnit = (db: Database, householdId: string, unitId: string) =>
  and(eq(units.id, unitId), inArray(units.productId, ownProductIds(db, householdId)))

async function exists(db: Database, householdId: string, unitId: string): Promise<boolean> {
  const rows = await db
    .select({ id: units.id })
    .from(units)
    .where(ownUnit(db, householdId, unitId))
  return rows.length > 0
}

async function takeOut(db: Database, householdId: string, change: TakeOutChange) {
  const updated = await db
    .update(units)
    .set({ status: DB_UNIT_STATUS[change.status], takenAt: change.at, takenBy: change.userId })
    .where(and(ownUnit(db, householdId, change.unitId), eq(units.status, DB_UNIT_STATUS.stock)))
    .returning({ id: units.id })
  if (updated.length > 0) return 'updated' as const
  return (await exists(db, householdId, change.unitId)) ? 'not-in-stock' : 'not-found'
}

async function returnToStock(db: Database, householdId: string, unitId: string) {
  const updated = await db
    .update(units)
    .set({ status: DB_UNIT_STATUS.stock, takenAt: null, takenBy: null })
    .where(and(ownUnit(db, householdId, unitId), ne(units.status, DB_UNIT_STATUS.stock)))
    .returning({ id: units.id })
  if (updated.length > 0) return 'updated' as const
  return (await exists(db, householdId, unitId)) ? 'already-in-stock' : 'not-found'
}

export function createUnitWriteRepository(db: Database) {
  return {
    takeOut: (householdId: string, change: TakeOutChange) => takeOut(db, householdId, change),
    returnToStock: (householdId: string, unitId: string) => returnToStock(db, householdId, unitId),
  }
}
