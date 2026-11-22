'use server'
// Wiedererkennen beim Erfassen (UX §1): passende Produkte für „Zu Spaghetti 500 g hinzufügen?“.
// Ohne Sitzung, ohne Haushalt oder bei ungültiger Eingabe gibt es schlicht keinen Vorschlag.
import { requireHouseholdUser } from '@/server/auth/guards'
import type { ProductMatch } from '../application/find-matching-products'
import { findMatchingProductsForHousehold } from '../application/stock-request'
import { productMatchQuerySchema } from '../schemas/stock'

export async function findMatchingProductsAction(input: unknown): Promise<ProductMatch[]> {
  const user = await requireHouseholdUser()
  if (!user.ok) return []
  const parsed = productMatchQuerySchema.safeParse(input)
  if (!parsed.success) return []
  return findMatchingProductsForHousehold(user.value.householdId, parsed.data)
}
