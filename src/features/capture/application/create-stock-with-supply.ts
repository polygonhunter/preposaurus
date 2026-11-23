// Speichern mit Rückmeldung zu „Heute versorgt“ (#231): vor und nach dem Schreiben dieselbe Rechnung
// wie die Übersicht, im Ergebnis die Änderung für den Satz „Euer Essen reicht jetzt X statt Y Tage“.
// Ein doppeltes Tippen (Replay) ändert nichts und bekommt keinen Satz. Ohne Bedarf auch nicht.
import 'server-only'
import { ok, type Result } from '@/shared/lib/result'
import {
  compareSupplyDays,
  type SupplyChange,
  type SupplyDaysFigures,
} from '../domain/supply-change'
import {
  createStock,
  type CreatedStock,
  type CreateStockDeps,
  type CreateStockError,
  type CreateStockRequest,
} from './create-stock'

export interface CreateStockWithSupplyDeps extends CreateStockDeps {
  /** Tage am heutigen Tag, null ohne Bedarf */
  readSupplyDays: (householdId: string) => Promise<SupplyDaysFigures | null>
}

export interface CreatedStockWithSupply extends CreatedStock {
  /** null, wenn sich die ganzen Tage nicht ändern, beim Replay oder ohne Bedarf */
  supplyChange: SupplyChange | null
}

export async function createStockWithSupply(
  deps: CreateStockWithSupplyDeps,
  request: CreateStockRequest,
): Promise<Result<CreatedStockWithSupply, CreateStockError>> {
  const before = await deps.readSupplyDays(request.householdId)
  const created = await createStock(deps, request)
  if (!created.ok) return created
  if (created.value.isReplay || before === null) return ok({ ...created.value, supplyChange: null })
  const after = await deps.readSupplyDays(request.householdId)
  const supplyChange = after === null ? null : compareSupplyDays(before, after)
  return ok({ ...created.value, supplyChange })
}
