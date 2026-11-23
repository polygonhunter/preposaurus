// Verdrahtet die Use-Cases des Erfassens mit der DB. Actions und Seiten rufen nur diese Funktionen
// auf, Sitzung und Haushalt haben sie vorher geprüft.
import 'server-only'
import { getDb } from '@/server/db/get-db'
import type { Result } from '@/shared/lib/result'
import { createCaptureOptionsRepository } from '../data/capture-options-repository'
import { createStockWriteRepository } from '../data/stock-write-repository'
import type { CaptureOptions } from '../domain/capture-options'
import type { StockDraft } from '../domain/stock-draft'
import { createStock, type CreatedStock, type CreateStockError } from './create-stock'
import { getCaptureOptions } from './get-capture-options'

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

export async function getCaptureOptionsForUser(user: HouseholdUser): Promise<CaptureOptions> {
  return getCaptureOptions(createCaptureOptionsRepository(await getDb()), user)
}
