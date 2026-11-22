// Bausteine der Seed-Listen für Lebensmittelarten. Namen und Schlüssel nennen keinen Behälter (die
// Dose ist ein Merkmal am Produkt), nur Unterschiede, die Nährwerte oder Haltbarkeit deutlich
// ändern, etwa „getrocknet“, „Konserve“ oder „tiefgekühlt“ (Granularitätsregel in
// docs/quellen/LEBENSMITTELARTEN.md).
import type { SystemCategoryKey } from '../kategorien'

// Anzeige-Richtwerte je 100 g bzw. 100 ml (M1-08). Fehlt ein Wert, setzt der Seed die Spalte auf
// leer. Sie sind nur Richtwerte, nie ein MHD.
type ReferenceValues = Readonly<{
  kcalPer100?: string
  proteinPer100?: string
  carbsPer100?: string
  fatPer100?: string
  typicalShelfLifeMonths?: number
}>

export type SystemFoodType = ReferenceValues &
  Readonly<{ key: string; name: string; category: SystemCategoryKey }>

type Entry = readonly [key: string, name: string, values?: ReferenceValues]

/**
 * Belegte Richtwerte aus docs/quellen/EMPFEHLUNGSWERTE.md §4.2: Nährwerte aus USDA SR Legacy mit
 * LMIV-Rechnung, übliche Haltbarkeit aus FoodKeeper (beide CC0).
 */
export function reference(
  [kcal, protein, carbs, fat]: readonly [kcal: number, protein: number, carbs: number, fat: number],
  shelfLifeMonths?: number,
): ReferenceValues {
  const nutrition = {
    kcalPer100: String(kcal),
    proteinPer100: String(protein),
    carbsPer100: String(carbs),
    fatPer100: String(fat),
  }
  return shelfLifeMonths === undefined ? nutrition : { ...nutrition, ...shelfLife(shelfLifeMonths) }
}

/** Nur die übliche Haltbarkeit, wenn es für die Nährwerte keinen passenden Eintrag gibt. */
export function shelfLife(months: number): ReferenceValues {
  return { typicalShelfLifeMonths: months }
}

export function inCategory(
  category: SystemCategoryKey,
  entries: readonly Entry[],
): SystemFoodType[] {
  return entries.map(([key, name, values]) => ({ ...values, key, name, category }))
}
