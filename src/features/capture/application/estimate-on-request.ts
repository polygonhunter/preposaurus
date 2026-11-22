// KI-Schätzungen nur auf ausdrückliche Wahl (#124, #115, #116). Aufgerufen werden diese
// Use-Cases ausschließlich über die Knöpfe „Von der KI schätzen lassen“ (MHD bei „Datum fehlt“)
// und „Keine Nährwerttabelle“. Kein anderer Pfad ruft die Schätz-Rollen auf: Die Erkennung
// (recognizeBestBefore) lässt ein fehlendes Datum leer. Jedes Ergebnis trägt das Kennzeichen
// (`isEstimated` bzw. Quelle `ai-estimate`, unbestätigt) und ist ein Vorschlag, gespeichert wird
// erst mit „Speichern“. Das Protokoll in ki_aufruf schreibt der Recognizer des Haushalts.
import 'server-only'
import type { BestBefore } from '@/features/inventory/domain/unit'
import type { NutritionValues } from '@/features/inventory/domain/nutrition-source'
import type {
  AiFailure,
  AiImage,
  RoleContexts,
  VisionRecognizer,
} from '@/server/ai/vision-recognizer'
import type { CalendarDay } from '@/shared/lib/dates'
import { err, ok, type Result } from '@/shared/lib/result'
import { mapBestBeforeEstimateAnswer } from '../domain/map-best-before-estimate'
import { mapNutritionEstimateAnswer } from '../domain/map-recognition'
import type { Confidence } from '../domain/plausibility'

/** Die KI hat geantwortet, aber nichts sinnvoll geschätzt. Es bleibt leer bzw. beim Richtwert. */
type EstimateError = AiFailure | { kind: 'no-estimate' }

interface EstimateRequest {
  recognizer: VisionRecognizer
  /** Foto der Verpackung als Grundlage der Schätzung */
  image: AiImage
  model: string
  context: RoleContexts['mhd_schaetzen']
}

export interface EstimatedBestBefore {
  /** Immer mit `isEstimated: true`, Genauigkeit Monat oder Jahr */
  bestBefore: BestBefore
  confidence: Confidence
}

export interface EstimatedNutrition {
  values: NutritionValues
  source: 'ai-estimate'
  /** Eine Schätzung muss gesondert bestätigt werden (#115) */
  isConfirmed: false
  confidence: Confidence
}

export async function estimateBestBefore(
  request: EstimateRequest & { today: CalendarDay },
): Promise<Result<EstimatedBestBefore, EstimateError>> {
  const { recognizer, image, model, context, today } = request
  const outcome = await recognizer.recognize({ role: 'mhd_schaetzen', image, model, context })
  if (!outcome.answer.ok) return outcome.answer
  const estimate = mapBestBeforeEstimateAnswer(outcome.answer.value, today)
  if (estimate.bestBefore === null) return err({ kind: 'no-estimate' })
  return ok({ bestBefore: estimate.bestBefore, confidence: estimate.confidence })
}

const hasAnyValue = ({ kcal, protein, carbs, fat }: NutritionValues) =>
  [kcal, protein, carbs, fat].some((value) => value !== null)

export async function estimateNutrition(
  request: EstimateRequest,
): Promise<Result<EstimatedNutrition, EstimateError>> {
  const { recognizer, image, model, context } = request
  const outcome = await recognizer.recognize({
    role: 'naehrwerte_schaetzen',
    image,
    model,
    context,
  })
  if (!outcome.answer.ok) return outcome.answer
  const { values, confidence } = mapNutritionEstimateAnswer(outcome.answer.value)
  if (!hasAnyValue(values)) return err({ kind: 'no-estimate' })
  return ok({ values, source: 'ai-estimate', isConfirmed: false, confidence })
}
