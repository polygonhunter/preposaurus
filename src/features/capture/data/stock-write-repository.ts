// Schreib-Repository des Speicherns (#51). Die Transaktion umschließt die ganze Arbeit des
// Use-Cases: Wirft sie, bleibt nichts gespeichert. Dazu die Suche nach wiedererkennbaren Produkten.
import 'server-only'
import { and, asc, eq } from 'drizzle-orm'
import type { Database } from '@/server/db/connection'
import { containers, storageLocations } from '@/server/db/schema/catalog'
import { products } from '@/server/db/schema/inventory'
import type { ProductCandidate } from '../domain/stock-records'
import { createStockTransaction } from './stock-transaction'

type StockTransactionRepository = ReturnType<typeof createStockTransaction>

async function findProductsByFoodType(
  db: Database,
  householdId: string,
  foodTypeId: string,
): Promise<ProductCandidate[]> {
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
    // Nur ein Lagerort desselben Haushalts, ein fehlerhafter Bezug zeigt nichts Fremdes.
    .leftJoin(
      storageLocations,
      and(
        eq(storageLocations.id, products.storageLocationId),
        eq(storageLocations.householdId, householdId),
      ),
    )
    .where(and(eq(products.householdId, householdId), eq(products.foodTypeId, foodTypeId)))
    .orderBy(asc(products.name), asc(products.createdAt))
  return rows.map(({ contentAmount, contentUnit, ...row }) => ({
    ...row,
    content: { value: Number(contentAmount), unit: contentUnit },
  }))
}

export function createStockWriteRepository(db: Database) {
  return {
    transaction: <T>(work: (tx: StockTransactionRepository) => Promise<T>) =>
      db.transaction((tx) => work(createStockTransaction(tx))),
    findProductsByFoodType: (householdId: string, foodTypeId: string) =>
      findProductsByFoodType(db, householdId, foodTypeId),
  }
}
