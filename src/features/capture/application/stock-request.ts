// Verdrahtet die Use-Cases des Erfassens mit der DB. Actions und Seiten rufen nur diese Funktionen
// auf, Sitzung und Haushalt haben sie vorher geprüft.
import 'server-only'
import { loadSupplyDaysNow } from '@/features/supply/application/supply-days-now'
import { getDb } from '@/server/db/get-db'
import type { Result } from '@/shared/lib/result'
import { createCaptureOptionsRepository } from '../data/capture-options-repository'
import { createStockWriteRepository } from '../data/stock-write-repository'
import type { CaptureOptions } from '../domain/capture-options'
import type { StockDraft } from '../domain/stock-draft'
import type { CreateStockError } from './create-stock'
import { createStockWithSupply, type CreatedStockWithSupply } from './create-stock-with-supply'
import { getCaptureOptions } from './get-capture-options'

interface HouseholdUser {
  householdId: string
  userId: string
}

export async function createStockForUser(
  user: HouseholdUser,
  draft: StockDraft,
): Promise<Result<CreatedStockWithSupply, CreateStockError>> {
  const writer = createStockWriteRepository(await getDb())
  const deps = { writer, now: () => new Date(), readSupplyDays: loadSupplyDaysNow }
  return createStockWithSupply(deps, { ...user, draft })
}

export async function getCaptureOptionsForUser(user: HouseholdUser): Promise<CaptureOptions> {
  return getCaptureOptions(createCaptureOptionsRepository(await getDb()), user)
}
