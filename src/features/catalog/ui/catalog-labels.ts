// Kurze Texte der Stammdaten-Seiten (EIN-04).
import { formatGermanNumber } from '@/shared/lib/quantities'
import type { CategoryEntry, FoodTypeEntry, FoodTypeReference } from '../domain/category'
import type { CategoryChoice } from '@/shared/ui/CategoryPicker'

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

const NO_REFERENCE = 'kein Richtwert'

const amountOrNone = (value: number | null, unit: string) =>
  value === null ? NO_REFERENCE : `${formatGermanNumber(value)} ${unit}`

const monthsLabel = (months: number | null) => {
  if (months === null) return NO_REFERENCE
  return months === 1 ? '1 Monat' : `${String(months)} Monate`
}

/** Richtwerte zum Lesen (#243): „Brennwert · 359 kcal“, fehlende als „kein Richtwert“ */
export function referenceFacts(reference: FoodTypeReference): { title: string; value: string }[] {
  return [
    { title: 'Brennwert', value: amountOrNone(reference.kcalPer100, 'kcal') },
    { title: 'Eiweiß', value: amountOrNone(reference.proteinPer100, 'g') },
    { title: 'Kohlenhydrate', value: amountOrNone(reference.carbsPer100, 'g') },
    { title: 'Fett', value: amountOrNone(reference.fatPer100, 'g') },
    { title: 'Übliche Haltbarkeit', value: monthsLabel(reference.typicalShelfLifeMonths) },
  ]
}
