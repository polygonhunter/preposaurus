import type {
  NutritionValues,
  ProductNutrition,
} from '@/features/inventory/domain/nutrition-source'

// Schätzwerte gibt es nur für Nährwerte und nur aus dem Richtwert der Lebensmittelart (#115).
// Ein MHD wird hier nie geschätzt: Fehlt es, bleibt es leer („Datum fehlt“, #116). Der Richtwert
// zur Haltbarkeit ist nur Hinweistext (#110).

const FIELDS = ['kcal', 'protein', 'carbs', 'fat'] as const

/**
 * Fehlende Nährwerte kommen aus dem Richtwert der Lebensmittelart. Wird auch nur ein Wert ergänzt,
 * trägt das Ergebnis die Herkunft „Richtwert“ und gilt bis zur gesonderten Bestätigung als
 * unbestätigt. Ohne Richtwert (eigene Lebensmittelart) bleibt das Fehlende leer.
 */
export function fillMissingNutrition(
  actual: ProductNutrition,
  foodTypeReference: NutritionValues | null,
): ProductNutrition {
  const values = { ...actual.values }
  let isFilled = false
  for (const field of FIELDS) {
    const reference = foodTypeReference?.[field] ?? null
    if (actual.values[field] !== null || reference === null) continue
    values[field] = reference
    isFilled = true
  }
  return isFilled ? { values, source: 'reference', confirmedAt: null } : actual
}
