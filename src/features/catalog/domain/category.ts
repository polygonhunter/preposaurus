// Kategorien und Lebensmittelarten in der Verwaltung (EIN-04, #76, #126). System-Einträge (Seed)
// lassen sich je Haushalt nur ausblenden, eigene auch ändern und, solange nichts sie nutzt, löschen.
import type { NamedEntry } from './catalog-name'

export interface ProductGroup {
  id: string
  name: string
}

export interface CategoryEntry extends NamedEntry {
  isSystem: boolean
  /** Vom Seed als entfallen ausgeblendet: Der Haushalt kann sie nicht wieder einblenden */
  isRetired: boolean
  productGroupId: string
  productGroupName: string
  /** Arten darin, die der Haushalt sieht (System und eigene, auch ausgeblendete) */
  foodTypeCount: number
  /** Produkte des Haushalts in dieser Kategorie */
  productCount: number
}

export interface FoodTypeEntry extends NamedEntry {
  key: string
  isSystem: boolean
  isRetired: boolean
  categoryId: string
  categoryName: string
  productGroupName: string
  /** Die Kategorie ist ausgeblendet, die Art steht dann auch nicht zur Wahl */
  isCategoryHidden: boolean
  /** Eigene Suchwörter (nur eigene Arten) */
  searchTerms: string[]
  kcalPer100: number | null
  productCount: number
}

/** Eigene Kategorie ohne Arten und ohne Produkte. System-Kategorien sind nie löschbar. */
export const canRemoveCategory = (category: CategoryEntry) =>
  !category.isSystem && category.foodTypeCount === 0 && category.productCount === 0

/** Eigene Art ohne Produkte, auch ohne verbrauchte. */
export const canRemoveFoodType = (foodType: FoodTypeEntry) =>
  !foodType.isSystem && foodType.productCount === 0
