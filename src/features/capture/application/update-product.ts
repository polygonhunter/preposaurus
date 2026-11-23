// Use-Case „Angaben bearbeiten“ (#49, VOR-04): Bezeichnung, Lebensmittelart (die Kategorie folgt),
// Inhalt, Behälter, Lagerort und Nährwerte eines Produkts. Admin und Mitglied dürfen das. Stammdaten
// gelten nur aus dem eigenen Haushalt bzw. als System-Einträge, sonst „nicht gefunden“ (#133).
// Nährwerte nach `planNutritionEdit`: Echte Werte entfernen „geschätzt“ (#115).
import 'server-only'
import { err, ok, type Result } from '@/shared/lib/result'
import { planNutritionEdit } from '../domain/nutrition-edit'
import type { EditableProduct } from '../domain/product-edit-records'
import type { FoodTypeRef } from '../domain/stock-records'
import type { UpdateProductInput } from '../schemas/product-edit'
import type { ProductEditor } from './product-editor'

type EditReference = 'product' | 'food-type' | 'storage-location' | 'container'

export interface UpdateProductError {
  kind: 'not-found'
  reference: EditReference
}

export interface UpdateProductDeps {
  editor: ProductEditor
  now: () => Date
}

/** Lebensmittelart des gespeicherten Produkts, damit die Detailseite danach stimmt. */
export interface UpdatedProduct {
  foodTypeId: string
}

const notFound = (reference: EditReference) => err({ kind: 'not-found', reference } as const)

async function missingReference(
  editor: ProductEditor,
  householdId: string,
  { containerId, storageLocationId }: UpdateProductInput,
): Promise<EditReference | null> {
  if (containerId !== null && !(await editor.hasContainer(containerId))) return 'container'
  if (storageLocationId === null) return null
  const hasLocation = await editor.hasStorageLocation(householdId, storageLocationId)
  return hasLocation ? null : 'storage-location'
}

function changeOf(
  input: UpdateProductInput,
  found: Readonly<{ product: EditableProduct; foodType: FoodTypeRef; now: Date }>,
) {
  const { product, foodType, now } = found
  const edit = { values: input.nutrition, confirmEstimate: input.confirmEstimate }
  return {
    id: product.id,
    categoryId: foodType.categoryId,
    foodTypeId: foodType.id,
    name: input.name ?? foodType.name,
    content: input.content,
    containerId: input.containerId,
    storageLocationId: input.storageLocationId,
    nutrition: planNutritionEdit(product.nutrition, edit, now),
  }
}

export async function updateProduct(
  { editor, now }: UpdateProductDeps,
  { householdId, input }: Readonly<{ householdId: string; input: UpdateProductInput }>,
): Promise<Result<UpdatedProduct, UpdateProductError>> {
  const product = await editor.findProduct(householdId, input.productId)
  if (product === null) return notFound('product')
  const foodType = await editor.findFoodType(householdId, input.foodTypeId)
  if (foodType === null) return notFound('food-type')
  const missing = await missingReference(editor, householdId, input)
  if (missing !== null) return notFound(missing)
  const change = changeOf(input, { product, foodType, now: now() })
  if (!(await editor.updateProduct(householdId, change))) return notFound('product')
  return ok({ foodTypeId: foodType.id })
}
