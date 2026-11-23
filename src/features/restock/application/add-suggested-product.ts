// „Auf die Liste“ an einem Vorschlag unter „Ersetzen“ (A14, #200): Aus dem live gerechneten
// Vorschlag wird ein echter Eintrag „nachkauf“. Steht das Produkt schon offen da, bleibt es bei
// einem Eintrag (wie nach einer Entnahme).
import 'server-only'
import { err, ok, type Result } from '@/shared/lib/result'
import type { ListedProduct } from './add-consumed-unit'
import type { RestockRepository } from './restock-repository'

type Repository = Pick<RestockRepository, 'findProduct' | 'addProductOnce'>

interface SuggestedProductInput {
  householdId: string
  productId: string
}

export async function addSuggestedProduct(
  repository: Repository,
  { householdId, productId }: SuggestedProductInput,
): Promise<Result<ListedProduct, Readonly<{ kind: 'not-found' }>>> {
  const product = await repository.findProduct(householdId, productId)
  if (product === null) return err({ kind: 'not-found' })
  const addedItemId = await repository.addProductOnce(householdId, product)
  return ok({ label: product.label, addedItemId })
}
