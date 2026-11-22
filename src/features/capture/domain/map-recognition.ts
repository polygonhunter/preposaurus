// Mapping der schlanken KI-Antworten ins strenge Fach-Modell (technik.html#api-ki „Grenzen der
// Schemas“). Das KI-Schema kennt keine Grenzen, deshalb wird hier geprüft: Mengen größer null,
// Nährwerte nicht negativ. Was nicht passt, wird null. `null` bleibt immer `null`.
import type { Quantity } from '@/shared/lib/quantities'
import type {
  AiConfidence,
  AiNutritionAnswer,
  AiNutritionEstimateAnswer,
  AiPackagingAnswer,
} from './ai-answers'
import type { NutritionValues } from './estimates'
import { resolveKcal, toPer100 } from './nutrition'
import type { Confidence } from './plausibility'

const CONFIDENCE: Readonly<Record<AiConfidence, Confidence>> = {
  hoch: 'high',
  mittel: 'medium',
  niedrig: 'low',
}

export function mapConfidence(confidence: AiConfidence): Confidence {
  return CONFIDENCE[confidence]
}

const positiveOrNull = (value: number | null) =>
  value !== null && Number.isFinite(value) && value > 0 ? value : null

const nonNegativeOrNull = (value: number | null) =>
  value !== null && Number.isFinite(value) && value >= 0 ? value : null

/** Behälter aus den Stammdaten. „sonstiges“ heißt: keiner davon, die Auswahl bleibt leer. */
type Container = Exclude<AiPackagingAnswer['behaelter'], 'sonstiges'>

export interface PackagingSuggestion {
  name: string | null
  foodTypeKey: string | null
  container: Container | null
  content: Quantity | null
  drainedWeightG: number | null
  confidence: Confidence
}

function mapContent({ wert, einheit }: AiPackagingAnswer['inhalt']): Quantity | null {
  const value = positiveOrNull(wert)
  return value === null || einheit === null ? null : { value, unit: einheit }
}

export function mapPackagingAnswer(answer: AiPackagingAnswer): PackagingSuggestion {
  const name = answer.bezeichnung?.trim() ?? ''
  return {
    name: name === '' ? null : name,
    foodTypeKey: answer.lebensmittelart,
    container: answer.behaelter === 'sonstiges' ? null : answer.behaelter,
    content: mapContent(answer.inhalt),
    drainedWeightG: positiveOrNull(answer.abtropfgewicht_g),
    confidence: mapConfidence(answer.sicherheit),
  }
}

export interface NutritionSuggestion {
  /** Je 100 g bzw. 100 ml. Bei `isPerPortion` noch je Portion, bis die Portionsgröße bekannt ist. */
  values: NutritionValues
  isPerPortion: boolean
  /** Eine Schätzung ohne Tabelle (#124). Muss gesondert bestätigt werden. */
  isEstimated: boolean
  confidence: Confidence
}

function labelValues(answer: AiNutritionAnswer | AiNutritionEstimateAnswer): NutritionValues {
  const kj = 'kj' in answer ? answer.kj : null
  return {
    kcal: resolveKcal({ kcal: nonNegativeOrNull(answer.kcal), kj: nonNegativeOrNull(kj) }),
    protein: nonNegativeOrNull(answer.eiweiss_g),
    carbs: nonNegativeOrNull(answer.kohlenhydrate_g),
    fat: nonNegativeOrNull(answer.fett_g),
  }
}

function scalePortion(values: NutritionValues, portionSize: number): NutritionValues {
  const scale = (value: number | null) => {
    if (value === null) return null
    const per100 = toPer100({ value, basis: 'portion', portionSize })
    return per100.ok ? per100.value : null
  }
  return {
    kcal: scale(values.kcal),
    protein: scale(values.protein),
    carbs: scale(values.carbs),
    fat: scale(values.fat),
  }
}

/** Gelesene Nährwerttabelle. kcal vor kJ, nur kJ wird umgerechnet. Portionen auf 100 umgerechnet. */
export function mapNutritionAnswer(answer: AiNutritionAnswer): NutritionSuggestion {
  const values = labelValues(answer)
  const portionSize = positiveOrNull(answer.portionsgroesse)
  const base = { isEstimated: false, confidence: mapConfidence(answer.sicherheit) }
  if (answer.bezug !== 'portion') return { ...base, values, isPerPortion: false }
  if (portionSize === null) return { ...base, values, isPerPortion: true }
  return { ...base, values: scalePortion(values, portionSize), isPerPortion: false }
}

/** Schätzung ohne Tabelle: immer als Schätzung gekennzeichnet, nie als gelesener Wert. */
export function mapNutritionEstimateAnswer(answer: AiNutritionEstimateAnswer): NutritionSuggestion {
  return {
    values: labelValues(answer),
    isPerPortion: false,
    isEstimated: true,
    confidence: mapConfidence(answer.sicherheit),
  }
}
