// Port für „Angaben bearbeiten“ (#49). Umgesetzt von `createProductEditRepository` in
// capture/data, in Tests von einem Fake. Jede Methode filtert auf die haushalt_id: Ein fremdes
// Produkt ist „nicht gefunden“ (#133), Stammdaten gelten nur eigen oder als System-Eintrag.
import 'server-only'
import type { EditableProduct, ProductChange } from '../domain/product-edit-records'
import type { FoodTypeRef } from '../domain/stock-records'

export interface ProductEditor {
  findProduct: (householdId: string, productId: string) => Promise<EditableProduct | null>
  /** System-Art oder eigene Art des Haushalts, sonst null */
  findFoodType: (householdId: string, foodTypeId: string) => Promise<FoodTypeRef | null>
  hasContainer: (containerId: string) => Promise<boolean>
  hasStorageLocation: (householdId: string, storageLocationId: string) => Promise<boolean>
  /** false: Das Produkt gibt es im Haushalt (nicht mehr) */
  updateProduct: (householdId: string, change: ProductChange) => Promise<boolean>
}
