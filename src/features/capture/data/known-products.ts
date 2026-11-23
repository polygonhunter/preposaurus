// Vorhandene Produkte des Haushalts fürs Wiedererkennen (UX §1, #207). Nur eigene Produkte mit
// Lebensmittelart, auch ohne Packung im Vorrat: Gerade der Nachschub nach dem Verbrauch soll das
// Produkt wiederfinden. Lagerort nur aus demselben Haushalt (#133).
import 'server-only'
import { and, asc, eq, isNotNull } from 'drizzle-orm'
import type { Database } from '@/server/db/connection'
import { containers, storageLocations } from '@/server/db/schema/catalog'
import { products } from '@/server/db/schema/inventory'
import type { KnownProduct } from '../domain/capture-options'

export async function loadKnownProducts(
  db: Database,
  householdId: string,
): Promise<KnownProduct[]> {
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      foodTypeId: products.foodTypeId,
      contentAmount: products.contentAmount,
      contentUnit: products.contentUnit,
      containerId: products.containerId,
      containerName: containers.name,
      storageLocationName: storageLocations.name,
    })
    .from(products)
    .leftJoin(containers, eq(containers.id, products.containerId))
    .leftJoin(
      storageLocations,
      and(
        eq(storageLocations.id, products.storageLocationId),
        eq(storageLocations.householdId, householdId),
      ),
    )
    .where(and(eq(products.householdId, householdId), isNotNull(products.foodTypeId)))
    .orderBy(asc(products.name), asc(products.createdAt))
  return rows.map(({ contentAmount, contentUnit, ...row }) => ({
    ...row,
    content: { value: Number(contentAmount), unit: contentUnit },
  }))
}
