// Lagerorte eines Haushalts (EIN-04). Jede Abfrage filtert auf haushalt_id, eine fremde ID findet
// also nichts (CODE_PRINZIPIEN §8). Gelöscht wird in einer Anweisung nur, wenn kein Produkt des
// Haushalts den Ort nutzt, damit zwischen Prüfen und Löschen nichts dazwischenkommt.
import 'server-only'
import { and, asc, count, eq, notExists, sql } from 'drizzle-orm'
import type { StorageLocation } from '@/features/catalog/domain/storage-location'
import type { Database } from '@/server/db/connection'
import { storageLocations } from '@/server/db/schema/catalog'
import { products } from '@/server/db/schema/inventory'
import type { RemoveOutcome } from './remove-outcome'
import { saveSortOrder } from './save-sort-order'

export interface StorageLocationRepository {
  /** Sichtbare und ausgeblendete Orte in ihrer Reihenfolge, mit Zahl der Produkte */
  list: (householdId: string) => Promise<StorageLocation[]>
  /** null, wenn der Name schon vergeben ist */
  create: (householdId: string, name: string) => Promise<string | null>
  rename: (householdId: string, id: string, name: string) => Promise<boolean>
  setHidden: (householdId: string, id: string, isHidden: boolean) => Promise<boolean>
  remove: (householdId: string, id: string) => Promise<RemoveOutcome>
  /** Nummeriert die übergebenen Orte in dieser Reihenfolge neu durch */
  saveOrder: (householdId: string, ids: readonly string[]) => Promise<void>
}

const ownLocation = (householdId: string, id: string) =>
  and(eq(storageLocations.householdId, householdId), eq(storageLocations.id, id))

async function list(db: Database, householdId: string): Promise<StorageLocation[]> {
  return db
    .select({
      id: storageLocations.id,
      name: storageLocations.name,
      isHidden: storageLocations.isHidden,
      productCount: count(products.id),
    })
    .from(storageLocations)
    .leftJoin(
      products,
      and(
        eq(products.storageLocationId, storageLocations.id),
        eq(products.householdId, householdId),
      ),
    )
    .where(eq(storageLocations.householdId, householdId))
    .groupBy(storageLocations.id)
    .orderBy(asc(storageLocations.sortOrder), asc(storageLocations.name))
}

async function create(db: Database, householdId: string, name: string): Promise<string | null> {
  // Neue Orte kommen ans Ende der Liste.
  const nextSortOrder = sql<number>`(select coalesce(max(${storageLocations.sortOrder}), -1) + 1
    from ${storageLocations} where ${storageLocations.householdId} = ${householdId})`
  const [row] = await db
    .insert(storageLocations)
    .values({ householdId, name, sortOrder: nextSortOrder })
    .onConflictDoNothing()
    .returning({ id: storageLocations.id })
  return row?.id ?? null
}

async function update(
  db: Database,
  { householdId, id }: Readonly<{ householdId: string; id: string }>,
  values: Partial<{ name: string; isHidden: boolean }>,
): Promise<boolean> {
  const rows = await db
    .update(storageLocations)
    .set(values)
    .where(ownLocation(householdId, id))
    .returning({ id: storageLocations.id })
  return rows.length > 0
}

async function remove(db: Database, householdId: string, id: string): Promise<RemoveOutcome> {
  const usedBy = db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.storageLocationId, storageLocations.id))
  const deleted = await db
    .delete(storageLocations)
    .where(and(ownLocation(householdId, id), notExists(usedBy)))
    .returning({ id: storageLocations.id })
  if (deleted.length > 0) return 'removed'
  const [existing] = await db
    .select({ id: storageLocations.id })
    .from(storageLocations)
    .where(ownLocation(householdId, id))
  return existing === undefined ? 'not-found' : 'in-use'
}

export function createStorageLocationRepository(db: Database): StorageLocationRepository {
  return {
    list: (householdId) => list(db, householdId),
    create: (householdId, name) => create(db, householdId, name),
    rename: (householdId, id, name) => update(db, { householdId, id }, { name }),
    setHidden: (householdId, id, isHidden) => update(db, { householdId, id }, { isHidden }),
    remove: (householdId, id) => remove(db, householdId, id),
    saveOrder: (householdId, ids) => saveSortOrder(db, storageLocations, { householdId, ids }),
  }
}
