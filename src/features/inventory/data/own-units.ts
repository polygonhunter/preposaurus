// Bedingung „Packung gehört zu diesem Haushalt“ für jedes Update (#133): Die Einheit hat keine
// eigene haushalt_id, ihr Produkt schon. So bleibt eine fremde Packung unberührt.
import 'server-only'
import { and, eq, inArray } from 'drizzle-orm'
import type { Database } from '@/server/db/connection'
import { products, units } from '@/server/db/schema/inventory'
import { isAnyOf } from './id-list'

const ownProductIds = (db: Database, householdId: string) =>
  db.select({ id: products.id }).from(products).where(eq(products.householdId, householdId))

export const ownUnit = (db: Database, householdId: string, unitId: string) =>
  and(eq(units.id, unitId), inArray(units.productId, ownProductIds(db, householdId)))

export const ownUnits = (db: Database, householdId: string, unitIds: readonly string[]) =>
  and(isAnyOf(units.id, unitIds), inArray(units.productId, ownProductIds(db, householdId)))
