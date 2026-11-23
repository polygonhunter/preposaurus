// Kurze Texte der Stammdaten-Seiten (EIN-04).
import type { CategoryEntry, FoodTypeEntry } from '../domain/category'
import type { CategoryChoice } from './CategoryPicker'

export function productCountLabel(count: number): string {
  if (count === 0) return 'Keine Produkte'
  return count === 1 ? '1 Produkt' : `${String(count)} Produkte`
}

const foodTypeCountLabel = (count: number) => (count === 1 ? '1 Art' : `${String(count)} Arten`)

const originLabel = (entry: { isSystem: boolean }) => (entry.isSystem ? 'Startliste' : 'eigene')

/** „Startliste · 12 Arten · ausgeblendet“ */
export function categorySummary(category: CategoryEntry): string {
  const parts = [originLabel(category), foodTypeCountLabel(category.foodTypeCount)]
  if (category.isHidden) parts.push('ausgeblendet')
  return parts.join(' · ')
}

/** „eigene · Kategorie ausgeblendet“ */
export function foodTypeSummary(foodType: FoodTypeEntry): string {
  const parts = [originLabel(foodType)]
  if (foodType.isHidden) parts.push('ausgeblendet')
  else if (foodType.isCategoryHidden) parts.push('Kategorie ausgeblendet')
  if (foodType.productCount > 0) parts.push(productCountLabel(foodType.productCount))
  return parts.join(' · ')
}

/** Kategorien, die beim Anlegen einer Art zur Wahl stehen: nicht ausgeblendet, außer der bisherigen */
export function categoryChoices(
  categories: readonly CategoryEntry[],
  currentId: string | null = null,
): CategoryChoice[] {
  return categories
    .filter((category) => !category.isHidden || category.id === currentId)
    .map(({ id, name, productGroupName }) => ({ id, name, productGroupName }))
}
