/** Nährwerte je 100 g bzw. 100 ml. Fehlendes ist null. */
export interface NutritionValues {
  kcal: number | null
  protein: number | null
  carbs: number | null
  fat: number | null
}

/**
 * Gespeicherte Herkunft der Nährwerte am Produkt (Spalte `naehrwerte_quelle`, #115, E-5):
 * `label` = `tabelle` (Nährwerttabelle gelesen), `manual` = `manuell`,
 * `ai-estimate` = `ki_schaetzung`. Einen Richtwert gibt es hier bewusst nicht: Er wird beim Lesen
 * aus der Lebensmittelart ergänzt und nie ins Produkt kopiert. Leer (null) = keine eigenen Werte.
 */
export type StoredNutritionSource = 'label' | 'manual' | 'ai-estimate'

/** Herkunft eines einzelnen Werts nach dem Auflösen, nur im Lesepfad. */
export type ValueOrigin = StoredNutritionSource | 'reference'

/** Nährwerte, so wie sie am Produkt gespeichert sind. */
export interface ProductNutrition {
  values: NutritionValues
  source: StoredNutritionSource | null
  /** Wann der Nutzer eine KI-Schätzung bestätigt hat (`naehrwerte_bestaetigt_am`) */
  confirmedAt: Date | null
}

/**
 * Eine KI-Schätzung, die noch niemand bestätigt hat. Die Bestätigung zählt nur für den Filter
 * „Unvollständig“, nicht für „ca.“: Eine bestätigte Schätzung bleibt eine Schätzung (E-5).
 */
export function isEstimateUnconfirmed(nutrition: Omit<ProductNutrition, 'values'>): boolean {
  return nutrition.source === 'ai-estimate' && nutrition.confirmedAt === null
}
