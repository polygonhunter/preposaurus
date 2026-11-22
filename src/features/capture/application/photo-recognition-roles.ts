// Je Foto-Rolle ein Aufruf und das Mapping ins Fach-Modell (capture/domain). Die KI liefert nur
// Vorschläge: Was sie nicht lesen kann, bleibt null, ein Datum entsteht nie aus `roh_text`.
// Nur Lesen: Schätz-Rollen ruft dieser Weg nie auf (#124).
import 'server-only'
import type { PreparedRecognition } from '@/features/ai-settings/application/prepare-recognition'
import type { AiFailure, AiImage } from '@/server/ai/vision-recognizer'
import type { AiRole } from '@/shared/config/ai-roles'
import type { PhotoRole } from '@/shared/config/constants'
import { ok, type Result } from '@/shared/lib/result'
import type { FoodTypeOption } from '../data/food-type-options'
import { mapBestBeforeAnswer, type BestBeforeReading } from '../domain/map-best-before-recognition'
import {
  mapNutritionAnswer,
  mapPackagingAnswer,
  type NutritionSuggestion,
  type PackagingSuggestion,
} from '../domain/map-recognition'
import { recognizeBestBefore } from './recognize-best-before'

export type RecognitionSuggestion =
  | { role: 'verpackung'; packaging: PackagingSuggestion }
  | { role: 'naehrwerte'; nutrition: NutritionSuggestion }
  | { role: 'mhd'; bestBefore: BestBeforeReading; conflictingDate: string | null }

export interface RecognitionRun {
  prepared: PreparedRecognition
  image: AiImage
  /** Erlaubte Lebensmittelarten, geladen nur für die Verpackung */
  loadFoodTypes: () => Promise<FoodTypeOption[]>
}

type Outcome = Promise<Result<RecognitionSuggestion, AiFailure>>

function modelFor(prepared: PreparedRecognition, role: AiRole): string {
  const model = prepared.models[role]
  // prepareRecognition liefert jede Pflichtrolle mit Modell, sonst wäre es ein Fehler im Code.
  if (model === undefined) throw new Error(`Kein Modell für die Rolle ${role}`)
  return model
}

async function runPackaging({ prepared, image, loadFoodTypes }: RecognitionRun): Outcome {
  const { answer } = await prepared.recognizer.recognize({
    role: 'verpackung',
    image,
    model: modelFor(prepared, 'verpackung'),
    context: { foodTypes: await loadFoodTypes() },
  })
  return answer.ok
    ? ok({ role: 'verpackung', packaging: mapPackagingAnswer(answer.value) })
    : answer
}

async function runNutrition({ prepared, image }: RecognitionRun): Outcome {
  const { answer } = await prepared.recognizer.recognize({
    role: 'naehrwerte',
    image,
    model: modelFor(prepared, 'naehrwerte'),
    context: {},
  })
  return answer.ok
    ? ok({ role: 'naehrwerte', nutrition: mapNutritionAnswer(answer.value) })
    : answer
}

async function runBestBefore({ prepared, image }: RecognitionRun): Outcome {
  const models = {
    first: modelFor(prepared, 'mhd'),
    second: prepared.models.mhd_zweitversuch ?? null,
  }
  const { result } = await recognizeBestBefore({ recognizer: prepared.recognizer, image, models })
  if (!result.ok) return result
  const { answer, conflictingDate } = result.value
  return ok({ role: 'mhd', bestBefore: mapBestBeforeAnswer(answer), conflictingDate })
}

export function runRecognitionTask(run: RecognitionRun, role: PhotoRole): Outcome {
  switch (role) {
    case 'verpackung':
      return runPackaging(run)
    case 'naehrwerte':
      return runNutrition(run)
    case 'mhd':
      return runBestBefore(run)
  }
}
