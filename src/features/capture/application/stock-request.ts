// Verdrahtet die Use-Cases des Speicherns mit der DB. Die Actions rufen nur diese Funktionen auf,
// Sitzung und Haushalt haben sie vorher geprüft.
import 'server-only'
import { getDb } from '@/server/db/get-db'
import type { Result } from '@/shared/lib/result'
import { createStockWriteRepository } from '../data/stock-write-repository'
import type { StockDraft } from '../domain/stock-draft'
import type { ProductMatchQuery } from '../schemas'
import { createStock, type CreatedStock, type CreateStockError } from './create-stock'
import { findMatchingProducts, type ProductMatch } from './find-matching-products'

interface HouseholdUser {
  householdId: string
  userId: string
}

export async function createStockForUser(
  user: HouseholdUser,
  draft: StockDraft,
): Promise<Result<CreatedStock, CreateStockError>> {
  const writer = createStockWriteRepository(await getDb())
  return createStock({ writer, now: () => new Date() }, { ...user, draft })
}

export async function findMatchingProductsForHousehold(
  householdId: string,
  query: ProductMatchQuery,
): Promise<ProductMatch[]> {
  const writer = createStockWriteRepository(await getDb())
  return findMatchingProducts(writer, { householdId, query })
}
