// Verdrahtet „Angaben bearbeiten“ (#49) mit der DB. Seite und Action haben Sitzung und Haushalt
// vorher geprüft. Die Produkt-ID der Seite kommt ungeprüft aus der Adresse.
import 'server-only'
import { z } from 'zod'
import { getDb } from '@/server/db/get-db'
import type { Result } from '@/shared/lib/result'
import { createProductEditRepository } from '../data/product-edit-repository'
import type { EditableProduct, ProductEditDto } from '../domain/product-edit-records'
import type { UpdateProductInput } from '../schemas/product-edit'
import { updateProduct, type UpdatedProduct, type UpdateProductError } from './update-product'

const toDto = ({ nutrition, ...product }: EditableProduct): ProductEditDto => ({
  ...product,
  nutrition: nutrition.values,
  isEstimateUnconfirmed: nutrition.source === 'ai-estimate' && nutrition.confirmedAt === null,
})

export async function loadProductForEdit(
  householdId: string,
  productId: string,
): Promise<ProductEditDto | null> {
  const parsed = z.uuid().safeParse(productId)
  if (!parsed.success) return null
  const product = await createProductEditRepository(await getDb()).findProduct(
    householdId,
    parsed.data,
  )
  return product === null ? null : toDto(product)
}

export async function updateProductForHousehold(
  householdId: string,
  input: UpdateProductInput,
): Promise<Result<UpdatedProduct, UpdateProductError>> {
  const editor = createProductEditRepository(await getDb())
  return updateProduct({ editor, now: () => new Date() }, { householdId, input })
}
