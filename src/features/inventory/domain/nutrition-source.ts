/** Nährwerte je 100 g bzw. 100 ml. Fehlendes ist null. */
export interface NutritionValues {
  kcal: number | null
  protein: number | null
  carbs: number | null
  fat: number | null
}

/**
 * Herkunft der Nährwerte am Produkt (#115, Spalte `naehrwerte_quelle`): vom Etikett gelesen,
 * von Hand eingegeben, Richtwert der Lebensmittelart oder KI-Schätzung auf ausdrückliche Wahl.
 */
export type NutritionSource = 'label' | 'manual' | 'reference' | 'ai-estimate'

export interface ProductNutrition {
  values: NutritionValues
  source: NutritionSource
  /** Wann der Nutzer Richtwert bzw. Schätzung bestätigt hat (`naehrwerte_bestaetigt_am`) */
  confirmedAt: Date | null
}

/** Diese Herkünfte gelten bis zur gesonderten Bestätigung als unbestätigt (#115). */
const SOURCES_NEEDING_CONFIRMATION: readonly NutritionSource[] = ['reference', 'ai-estimate']

/** Stammen die Werte aus Richtwert oder Schätzung und hat sie noch niemand bestätigt? */
export function isNutritionUnconfirmed(nutrition: Omit<ProductNutrition, 'values'>): boolean {
  return SOURCES_NEEDING_CONFIRMATION.includes(nutrition.source) && nutrition.confirmedAt === null
}
