import { isNutritionUnconfirmed, type ProductNutrition } from './nutrition-source'
import type { StockUnit } from './unit'

// Filter „Unvollständig“ (UX-Konzept §4): ein Sammelort für fehlende Angaben, ohne Mahnung.
// Jede Zeile bekommt genau eine Aktion, deshalb liefert jede Prüfung höchstens einen Grund.

/** Was an einem Produkt fehlt: kcal fehlen ganz, oder Richtwert bzw. Schätzung ist unbestätigt. */
export type NutritionGap = 'missing' | 'unconfirmed'

/** Eine Packung im Vorrat ohne Datum. Verbrauchte und entsorgte brauchen kein Datum mehr. */
export function isMissingBestBefore(unit: Pick<StockUnit, 'status' | 'bestBefore'>): boolean {
  return unit.status === 'stock' && unit.bestBefore === null
}

/** Fehlende kcal wiegen schwerer als unbestätigte, denn ohne kcal zählt das Produkt mit 0. */
export function nutritionGapOf(nutrition: ProductNutrition): NutritionGap | null {
  if (nutrition.values.kcal === null) return 'missing'
  return isNutritionUnconfirmed(nutrition) ? 'unconfirmed' : null
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
  P extends { nutrition: ProductNutrition },
>({ units, products }: IncompleteInput<U, P>): IncompleteItems<U, P> {
  const incompleteProducts: IncompleteItems<U, P>['products'] = []
  for (const product of products) {
    const gap = nutritionGapOf(product.nutrition)
    if (gap !== null) incompleteProducts.push({ product, gap })
  }
  return { units: units.filter(isMissingBestBefore), products: incompleteProducts }
}
