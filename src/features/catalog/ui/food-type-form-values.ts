// Texte des Formulars einer eigenen Lebensmittelart (#126, #243): leer oder aus der gespeicherten
// Art. Zahlen stehen mit Komma da, wie man sie eintippt.
import type { FoodTypeField } from '../actions/save-food-type-action'
import type { FoodTypeEntry } from '../domain/category'

export type FoodTypeFormValues = Readonly<Record<FoodTypeField, string>>

const numberText = (value: number | null) => (value === null ? '' : String(value).replace('.', ','))

export function emptyFoodTypeFormValues(categoryId: string): FoodTypeFormValues {
  return {
    name: '',
    categoryId,
    searchTerms: '',
    kcalPer100: '',
    proteinPer100: '',
    carbsPer100: '',
    fatPer100: '',
    typicalShelfLifeMonths: '',
  }
}

export function foodTypeFormValues(foodType: FoodTypeEntry): FoodTypeFormValues {
  return {
    name: foodType.name,
    categoryId: foodType.categoryId,
    searchTerms: foodType.searchTerms.join(', '),
    kcalPer100: numberText(foodType.kcalPer100),
    proteinPer100: numberText(foodType.proteinPer100),
    carbsPer100: numberText(foodType.carbsPer100),
    fatPer100: numberText(foodType.fatPer100),
    typicalShelfLifeMonths: numberText(foodType.typicalShelfLifeMonths),
  }
}
