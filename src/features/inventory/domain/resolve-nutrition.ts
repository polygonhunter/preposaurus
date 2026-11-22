import type {
  NutritionValues,
  ProductNutrition,
  StoredNutritionSource,
  ValueOrigin,
} from './nutrition-source'

// Lesepfad: Fehlende Werte kommen live aus dem Richtwert der Lebensmittelart (E-5). Das Ergebnis
// wird nie gespeichert, so bleibt ein geänderter Richtwert sofort überall wirksam.

type NutritionField = keyof NutritionValues

/** Ein Wert mit seiner Herkunft. Fehlt er auch im Richtwert, sind beide null. */
interface ResolvedValue {
  value: number | null
  origin: ValueOrigin | null
}

export type ResolvedNutrition = Record<NutritionField, ResolvedValue>

/** Herkünfte, deren Werte „ca.“ bekommen (UX §4, E-5), unabhängig von einer Bestätigung. */
const ESTIMATED_ORIGINS: readonly ValueOrigin[] = ['reference', 'ai-estimate']

// Eigener Wert ohne gespeicherte Herkunft verletzt die Regel „leer ⇔ keine Werte“. Dann gilt er
// als von Hand eingegeben, denn er stammt sicher nicht aus einem Richtwert.
const FALLBACK_SOURCE: StoredNutritionSource = 'manual'

function resolveValue(
  own: number | null,
  source: StoredNutritionSource | null,
  reference: number | null,
): ResolvedValue {
  if (own !== null) return { value: own, origin: source ?? FALLBACK_SOURCE }
  if (reference !== null) return { value: reference, origin: 'reference' }
  return { value: null, origin: null }
}

/** Je Feld der eigene Wert des Produkts, sonst der Richtwert der Lebensmittelart. */
export function resolveNutrition(
  product: ProductNutrition,
  foodTypeReference: NutritionValues | null,
): ResolvedNutrition {
  const resolve = (field: NutritionField) =>
    resolveValue(product.values[field], product.source, foodTypeReference?.[field] ?? null)
  return {
    kcal: resolve('kcal'),
    protein: resolve('protein'),
    carbs: resolve('carbs'),
    fat: resolve('fat'),
  }
}

/** Stammen die kcal aus Richtwert oder KI-Schätzung? Grundlage für `isKcalEstimated` und „ca.“. */
export function hasEstimatedKcal(resolved: ResolvedNutrition): boolean {
  const { origin } = resolved.kcal
  return origin !== null && ESTIMATED_ORIGINS.includes(origin)
}
