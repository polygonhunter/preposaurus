// „Auf die Nachkaufen-Liste“ nach einer Entnahme (#74, NK-02, UX D15): setzt das Produkt der eben
// entnommenen Packung als Eintrag „nachkauf“ auf die Liste. Steht es schon offen da, bleibt es bei
// einem Eintrag, damit zwei Entnahmen nicht zweimal „Linsen“ ergeben.
import 'server-only'
import { err, ok, type Result } from '@/shared/lib/result'
import type { RestockRepository } from './restock-repository'

type Repository = Pick<RestockRepository, 'findConsumedProduct' | 'addProductOnce'>

interface ConsumedUnitInput {
  householdId: string
  unitId: string
}

export interface ListedProduct {
  label: string
  /** Der neue Eintrag; null, wenn das Produkt schon offen auf der Liste stand */
  addedItemId: string | null
}

export async function addConsumedUnit(
  repository: Repository,
  { householdId, unitId }: ConsumedUnitInput,
): Promise<Result<ListedProduct, Readonly<{ kind: 'not-found' }>>> {
  const product = await repository.findConsumedProduct(householdId, unitId)
  if (product === null) return err({ kind: 'not-found' })
  const addedItemId = await repository.addProductOnce(householdId, product)
  return ok({ label: product.label, addedItemId })
}
