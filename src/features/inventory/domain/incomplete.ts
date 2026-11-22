import { isInStockWithoutDate } from '@/shared/lib/stock-unit'
import {
  isEstimateUnconfirmed,
  type NutritionValues,
  type ProductNutrition,
} from './nutrition-source'
import { resolveNutrition } from './resolve-nutrition'
import type { StockUnit } from './unit'

// Filter „Unvollständig“ (UX-Konzept §4, DATENKATALOG A18): ein Sammelort für fehlende Angaben,
// ohne Mahnung. Jede Zeile bekommt genau eine Aktion, deshalb liefert jede Prüfung höchstens
// einen Grund.

/**
 * Was an einem Produkt fehlt: kcal fehlen ganz (auch kein Richtwert), es gibt keine eigenen Werte
 * (es zählt der Richtwert), oder eine KI-Schätzung ist noch unbestätigt.
 */
export type NutritionGap = 'missing' | 'no-label' | 'unconfirmed'

/** Fehlende kcal wiegen am schwersten, denn dann zählt das Produkt mit 0. */
export function nutritionGapOf(
  nutrition: ProductNutrition,
  foodTypeReference: NutritionValues | null,
): NutritionGap | null {
  if (resolveNutrition(nutrition, foodTypeReference).kcal.value === null) return 'missing'
  if (nutrition.source === null) return 'no-label'
  return isEstimateUnconfirmed(nutrition) ? 'unconfirmed' : null
}

interface IncompleteInput<U, P> {
  units: readonly U[]
  products: readonly P[]
}

interface IncompleteItems<U, P> {
  /** Packungen mit „Datum fehlt“ */
  units: U[]
  /** Produkte mit fehlenden oder unbestätigten Nährwerten */
  products: { product: P; gap: NutritionGap }[]
}

/** Alles für den Filter „Unvollständig“, in der Reihenfolge der Eingabe. */
export function findIncomplete<
  U extends Pick<StockUnit, 'status' | 'bestBefore'>,
  P extends { nutrition: ProductNutrition; foodTypeReference: NutritionValues | null },
>({ units, products }: IncompleteInput<U, P>): IncompleteItems<U, P> {
  const incompleteProducts: IncompleteItems<U, P>['products'] = []
  for (const product of products) {
    const gap = nutritionGapOf(product.nutrition, product.foodTypeReference)
    if (gap !== null) incompleteProducts.push({ product, gap })
  }
  return { units: units.filter(isInStockWithoutDate), products: incompleteProducts }
}
