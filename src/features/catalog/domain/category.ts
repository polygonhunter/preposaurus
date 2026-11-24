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

/**
 * Richtwerte einer Lebensmittelart je 100 g bzw. ml (#243): gleich für System- und eigene Arten.
 * Sie gelten nur, wo ein Produkt keine eigenen Werte hat, und stehen dann als „ca.“ da. Die übliche
 * Haltbarkeit ist nur ein Hinweis, nie ein MHD.
 */
export interface FoodTypeReference {
  kcalPer100: number | null
  proteinPer100: number | null
  carbsPer100: number | null
  fatPer100: number | null
  typicalShelfLifeMonths: number | null
}

export interface FoodTypeEntry extends NamedEntry, FoodTypeReference {
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
  productCount: number
}

/** Eigene Kategorie ohne Arten und ohne Produkte. System-Kategorien sind nie löschbar. */
export const canRemoveCategory = (category: CategoryEntry) =>
  !category.isSystem && category.foodTypeCount === 0 && category.productCount === 0

/** Eigene Art ohne Produkte, auch ohne verbrauchte. */
export const canRemoveFoodType = (foodType: FoodTypeEntry) =>
  !foodType.isSystem && foodType.productCount === 0

/**
 * Eigene Arten derselben Kategorie in ihrer Reihenfolge, unter denen eine eigene Art rücken kann
 * (#243). System-Arten haben die Reihenfolge der Startliste und rücken nicht: null.
 */
export function ownSiblingIds(foodTypes: readonly FoodTypeEntry[], id: string): string[] | null {
  const moved = foodTypes.find((foodType) => foodType.id === id)
  if (moved === undefined || moved.isSystem) return null
  return foodTypes
    .filter((foodType) => !foodType.isSystem && foodType.categoryId === moved.categoryId)
    .map((foodType) => foodType.id)
}
