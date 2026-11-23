// Nährwerte nachträglich bearbeiten (#49, #115): Nährwerte sind jederzeit änderbar.
// - Andere Werte gelten als eigene Angabe (`manual`), „ca.“ und „geschätzt“ entfallen.
// - Gleiche Werte behalten ihre Herkunft. Eine unbestätigte KI-Schätzung lässt sich so bestätigen.
// - Ohne einen einzigen Wert gilt wieder der Richtwert der Lebensmittelart (E-5).
import type {
  NutritionValues,
  ProductNutrition,
} from '@/features/inventory/domain/nutrition-source'
import { hasAnyNutritionValue } from './stock-draft'

export interface NutritionEdit {
  values: NutritionValues
  /** „Schätzung bestätigen“ gewählt, zählt nur bei einer unbestätigten KI-Schätzung */
  confirmEstimate: boolean
}

const NO_NUTRITION: ProductNutrition = {
  values: { kcal: null, protein: null, carbs: null, fat: null },
  source: null,
  confirmedAt: null,
}

// numeric(6,2) in der DB: Abweichungen unter einem halben Hundertstel sind Rundung
const VALUE_TOLERANCE = 0.005

const isSameValue = (a: number | null, b: number | null) =>
  a === null || b === null ? a === b : Math.abs(a - b) < VALUE_TOLERANCE

const FIELDS = ['kcal', 'protein', 'carbs', 'fat'] as const

const isSameValues = (a: NutritionValues, b: NutritionValues) =>
  FIELDS.every((field) => isSameValue(a[field], b[field]))

function keepSource(current: ProductNutrition, confirmEstimate: boolean, now: Date) {
  const confirms = current.source === 'ai-estimate' && confirmEstimate
  return { ...current, confirmedAt: current.confirmedAt ?? (confirms ? now : null) }
}

/** Was nach dem Bearbeiten gespeichert wird. */
export function planNutritionEdit(
  current: ProductNutrition,
  edit: NutritionEdit,
  now: Date,
): ProductNutrition {
  if (!hasAnyNutritionValue(edit.values)) return NO_NUTRITION
  if (current.source !== null && isSameValues(current.values, edit.values)) {
    return keepSource(current, edit.confirmEstimate, now)
  }
  return { values: edit.values, source: 'manual', confirmedAt: null }
}
