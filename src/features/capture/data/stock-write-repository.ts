// Schreib-Repository des Speicherns (#51). Die Transaktion umschließt die ganze Arbeit des
// Use-Cases: Wirft sie, bleibt nichts gespeichert. Das Wiedererkennen liest known-products.ts.
import 'server-only'
import type { Database } from '@/server/db/connection'
import { createStockTransaction } from './stock-transaction'

type StockTransactionRepository = ReturnType<typeof createStockTransaction>

export function createStockWriteRepository(db: Database) {
  return {
    transaction: <T>(work: (tx: StockTransactionRepository) => Promise<T>) =>
      db.transaction((tx) => work(createStockTransaction(tx))),
  }
}
