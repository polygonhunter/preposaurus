// Datensätze zwischen Use-Case und Repository beim Bearbeiten eines Produkts (#49). Reine Typen in
// domain/, damit application/ (Port) und data/ (Umsetzung) dieselbe Form teilen.
import type { ProductNutrition } from '@/features/inventory/domain/nutrition-source'
import type { ContentQuantity } from '@/shared/lib/quantities'

/** Ein Produkt des Haushalts, so wie das Formular „Angaben bearbeiten“ es braucht. */
export interface EditableProduct {
  id: string
  name: string
  /** null: ohne Lebensmittelart (heute optional), dann wählt man eine */
  foodTypeId: string | null
  content: ContentQuantity
  containerId: string | null
  storageLocationId: string | null
  nutrition: ProductNutrition
}

/** Was gespeichert wird. Die Kategorie kommt immer aus der Lebensmittelart (#110). */
export interface ProductChange {
  id: string
  categoryId: string
  foodTypeId: string
  name: string
  content: ContentQuantity
  containerId: string | null
  storageLocationId: string | null
  nutrition: ProductNutrition
}

/** Was das Formular bekommt: Werte des Produkts, ohne Zeitpunkte. */
export interface ProductEditDto extends Omit<EditableProduct, 'nutrition'> {
  nutrition: ProductNutrition['values']
  /** KI-Schätzung, die noch niemand bestätigt hat: Das Formular bietet „Bestätigen“ an (#115) */
  isEstimateUnconfirmed: boolean
}
