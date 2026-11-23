import { isInStockWithoutDate } from '@/shared/lib/stock-unit'
import {
  isEstimateUnconfirmed,
  type NutritionValues,
  type ProductNutrition,
} from './nutrition-source'
import { resolveNutrition } from './resolve-nutrition'
import type { StockUnit } from './unit'

// Filter „Unvollständig“ (UX-Konzept §4, DATENKATALOG A18): ein Sammelort für fehlende Angaben,
// ohne Mahnung. Jede Zeile nennt, was fehlt (#221), damit klar ist, was nachzutragen ist.

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

/**
 * Gründe im Filter „Unvollständig“, in der Reihenfolge ihres Gewichts: Fehlen die kcal, zählt die
 * Packung mit 0. Ohne Datum zählt sie nur heute. Eine unbestätigte Schätzung zählt schon mit.
 * Gespiegelt in `incompleteReasonSchema` (inventory/schemas/shared.ts), ein Typtest hält beide
 * deckungsgleich.
 */
export type IncompleteReason = 'nutrition-missing' | 'date-missing' | 'estimate-unconfirmed'

const REASON_ORDER: readonly IncompleteReason[] = [
  'nutrition-missing',
  'date-missing',
  'estimate-unconfirmed',
]

/**
 * Nur, was wirklich nachzutragen ist: kcal fehlen ganz, oder eine KI-Schätzung wartet auf
 * Bestätigung. Fehlen nur die freiwilligen eigenen Werte und der Richtwert der Art springt ein
 * (`no-label`), ist die Packung vollständig. Das steht am Produkt als „Nährwerte: Richtwert“ und an
 * der Kernzahl als „ca.“ (UX-Konzept §4, #213).
 */
const GAP_REASON: Partial<Record<NutritionGap, IncompleteReason>> = {
  missing: 'nutrition-missing',
  unconfirmed: 'estimate-unconfirmed',
}

export interface IncompleteCheck extends Pick<StockUnit, 'status' | 'bestBefore'> {
  /** Lücke des Produkts der Packung (`nutritionGapOf`) */
  nutritionGap: NutritionGap | null
}

/** Was an einer Packung im Vorrat nachzutragen ist, nach Gewicht. Leer heißt vollständig. */
export function incompleteReasonsOf(unit: IncompleteCheck): IncompleteReason[] {
  if (unit.status !== 'stock') return []
  const gapReason = unit.nutritionGap === null ? undefined : GAP_REASON[unit.nutritionGap]
  const reasons = new Set<IncompleteReason>()
  if (gapReason !== undefined) reasons.add(gapReason)
  if (isInStockWithoutDate(unit)) reasons.add('date-missing')
  return REASON_ORDER.filter((reason) => reasons.has(reason))
}

export interface ReasonCount {
  reason: IncompleteReason
  /** Packungen mit diesem Grund; eine Packung kann mehrere Gründe haben */
  packages: number
}

/** Gründe einer Zeile, nach Gewicht, je Grund die Zahl der Packungen. Ohne Lücke leer. */
export function incompleteReasonCounts(units: readonly IncompleteCheck[]): ReasonCount[] {
  const counts = new Map<IncompleteReason, number>()
  for (const unit of units) {
    for (const reason of incompleteReasonsOf(unit))
      counts.set(reason, (counts.get(reason) ?? 0) + 1)
  }
  return REASON_ORDER.flatMap((reason) => {
    const packages = counts.get(reason)
    return packages === undefined ? [] : [{ reason, packages }]
  })
}
