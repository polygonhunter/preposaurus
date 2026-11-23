'use server'
// Angaben eines Produkts speichern (#49, VOR-04). Admin und Mitglied dürfen das. Dünne Hülle:
// Sitzung und Haushalt prüfen, Eingabe mit Zod prüfen, Use-Case aufrufen, Ergebnis in einen ruhigen
// deutschen Satz übersetzen. Danach geht es zur Detailseite der (evtl. neuen) Lebensmittelart.
import { z } from 'zod'
import { requireHouseholdUser } from '@/server/auth/guards'
import { detailPath } from '@/shared/config/stock-paths'
import { updateProductForHousehold } from '../application/product-edit-services'
import type { UpdateProductError } from '../application/update-product'
import { updateProductSchema } from '../schemas/product-edit'
import { failure, SESSION_MESSAGE, type EditActionState } from './edit-messages'

const REFERENCE_MESSAGES = {
  product: 'Dieses Produkt gibt es nicht mehr.',
  'food-type': 'Diese Lebensmittelart gibt es nicht mehr. Bitte wählt sie neu aus.',
  'storage-location': 'Diesen Lagerort gibt es nicht mehr. Bitte wählt ihn neu aus.',
  container: 'Diesen Behälter gibt es nicht mehr. Bitte wählt ihn neu aus.',
} as const

const errorMessage = (error: UpdateProductError) => REFERENCE_MESSAGES[error.reference]

export type UpdateProductState = EditActionState<{ href: string }>

export async function updateProductAction(input: unknown): Promise<UpdateProductState> {
  const user = await requireHouseholdUser()
  if (!user.ok) return failure(SESSION_MESSAGE)
  const parsed = updateProductSchema.safeParse(input)
  if (!parsed.success) {
    return failure('Bitte prüft die Angaben.', z.flattenError(parsed.error).fieldErrors)
  }
  const result = await updateProductForHousehold(user.value.householdId, parsed.data)
  if (!result.ok) return failure(errorMessage(result.error))
  return { status: 'saved', href: detailPath({ kind: 'food-type', id: result.value.foodTypeId }) }
}
