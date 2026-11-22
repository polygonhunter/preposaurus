import type { BestBefore } from '@/features/inventory/domain/unit'
import { addDays, type CalendarDay } from '@/shared/lib/dates'
import { err, ok, type Result } from '@/shared/lib/result'

// Schätzwerte gibt es nur auf ausdrücklichen Wunsch und immer mit Kennzeichen. Die KI schätzt nie.

interface EstimateRequest {
  today: CalendarDay
  /** Übliche Haltbarkeit der Kategorie in Tagen (Seed, U3), null wenn unbekannt */
  typicalShelfLifeDays: number | null
}

/**
 * „Ohne Datum“: geschätztes MHD = heute + übliche Haltbarkeit der Kategorie, markiert als
 * „geschätzt“. Ohne üblichen Wert gibt es keine Schätzung, dann muss ein Datum eingegeben werden.
 */
export function estimateBestBeforeOnRequest({
  today,
  typicalShelfLifeDays,
}: EstimateRequest): Result<BestBefore, { kind: 'no-typical-value' }> {
  if (typicalShelfLifeDays === null || typicalShelfLifeDays <= 0) {
    return err({ kind: 'no-typical-value' })
  }
  return ok({ date: addDays(today, typicalShelfLifeDays), precision: 'day', isEstimated: true })
}

/** Nährwerte je 100 g bzw. 100 ml. Fehlendes ist null. */
export interface NutritionValues {
  kcal: number | null
  protein: number | null
  carbs: number | null
  fat: number | null
}

export interface ResolvedNutrition {
  values: NutritionValues
  /** Mindestens ein Wert stammt aus dem Kategorie-Durchschnitt */
  isEstimated: boolean
}

const FIELDS = ['kcal', 'protein', 'carbs', 'fat'] as const

/** Fehlende Nährwerte kommen aus dem Kategorie-Durchschnitt, markiert als „geschätzt“. */
export function fillMissingNutrition(
  actual: NutritionValues,
  categoryAverage: NutritionValues,
): ResolvedNutrition {
  const values = { ...actual }
  let isEstimated = false
  for (const field of FIELDS) {
    if (actual[field] !== null || categoryAverage[field] === null) continue
    values[field] = categoryAverage[field]
    isEstimated = true
  }
  return { values, isEstimated }
}
