'use server'
// „Auf die Liste“ an einem Vorschlag unter „Ersetzen“ (A14, #200). Prüft Eingabe und Haushalt
// selbst, weil eine Action per POST direkt aufrufbar ist (CODE_PRINZIPIEN §7).
import { refresh } from 'next/cache'
import { requireHouseholdUser } from '@/server/auth/guards'
import { addSuggestedProduct } from '../application/add-suggested-product'
import { restockRepository } from '../application/restock-services'
import { suggestedProductIdSchema } from '../schemas'
import { ACCESS_MESSAGE, type RestockActionResult } from './restock-messages'

/** `addedItemId` ist null, wenn das Produkt schon offen auf der Liste stand */
type AddSuggestionResult = RestockActionResult<{ addedItemId: string | null }>

const GONE = 'Dieses Lebensmittel gibt es nicht mehr. Die Liste ist jetzt neu geladen.'

export async function addSuggestionAction(productId: unknown): Promise<AddSuggestionResult> {
  const parsed = suggestedProductIdSchema.safeParse(productId)
  if (!parsed.success) return { ok: false, message: GONE }
  const user = await requireHouseholdUser()
  if (!user.ok) return { ok: false, message: ACCESS_MESSAGE }
  const result = await addSuggestedProduct(await restockRepository(), {
    householdId: user.value.householdId,
    productId: parsed.data,
  })
  refresh()
  return result.ok
    ? { ok: true, addedItemId: result.value.addedItemId }
    : { ok: false, message: GONE }
}
