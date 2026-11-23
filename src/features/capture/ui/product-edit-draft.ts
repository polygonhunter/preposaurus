// Zustand des Formulars „Angaben bearbeiten“ (#49) und seine Fehler je Feld. Geprüft wird mit
// productEditFormSchema (capture/schemas/product-edit.ts), hier wird nur übersetzt.
import type { z } from 'zod'
import { formatQuantity } from '@/shared/lib/quantities'
import type { ProductEditDto } from '../domain/product-edit-records'
import { NUTRITION_FIELDS, type NutritionField } from './manual-capture-draft'

export interface ProductEditDraft {
  productId: string
  name: string
  foodTypeId: string | null
  content: string
  containerId: string | null
  storageLocationId: string | null
  nutrition: Record<NutritionField, string>
  confirmEstimate: boolean
}

// Ohne Tausenderpunkt, damit der Wert unverändert zurückgelesen wird
const nutritionText = (value: number | null) =>
  value === null ? '' : String(value).replace('.', ',')

export function draftOfProduct(product: ProductEditDto): ProductEditDraft {
  const { kcal, protein, carbs, fat } = product.nutrition
  return {
    productId: product.id,
    name: product.name,
    foodTypeId: product.foodTypeId,
    content: formatQuantity(product.content),
    containerId: product.containerId,
    storageLocationId: product.storageLocationId,
    nutrition: {
      kcal: nutritionText(kcal),
      protein: nutritionText(protein),
      carbs: nutritionText(carbs),
      fat: nutritionText(fat),
    },
    confirmEstimate: false,
  }
}

/** Felder mit eigener Meldung, in der Reihenfolge des Formulars. `form` steht am Knopf. */
const EDIT_FIELDS = ['name', 'foodTypeId', 'content', ...NUTRITION_FIELDS] as const
export type EditField = (typeof EDIT_FIELDS)[number] | 'form'
export type EditErrors = Partial<Record<EditField, string>>

const isEditField = (key: unknown): key is EditField =>
  (EDIT_FIELDS as readonly unknown[]).includes(key)

function fieldOf(path: readonly PropertyKey[]): EditField {
  const [first, second] = path
  const key = first === 'nutrition' ? second : first
  return isEditField(key) ? key : 'form'
}

/** Erste Meldung je Feld. Was keinem Feld gehört, steht allgemein am Knopf. */
export function editErrorsOf(error: z.ZodError): EditErrors {
  const errors: EditErrors = {}
  for (const issue of error.issues) {
    const field = fieldOf(issue.path)
    errors[field] ??= field === 'form' ? 'Bitte prüft die Angaben.' : issue.message
  }
  return errors
}

export const firstEditField = (errors: EditErrors): EditField | null =>
  EDIT_FIELDS.find((field) => errors[field] !== undefined) ?? null
