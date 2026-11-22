// MHD erkennen mit automatischem Zweitversuch (#114): Liefert die Rolle `mhd` Sicherheit
// „niedrig“ oder kein Datum, folgt ein Versuch mit `mhd_zweitversuch` (stärkeres Modell).
// Beide Aufrufe kommen zurück, damit beide im Protokoll `ki_aufruf` landen.
import 'server-only'
import type {
  AiImage,
  AiCallRecord,
  AiFailure,
  VisionRecognizer,
} from '@/server/ai/vision-recognizer'
import type { BestBeforeAnswer } from '@/features/capture/schemas'
import { ok, type Result } from '@/shared/lib/result'
import { needsSecondAttempt, pickBestBeforeAnswer } from '../domain/best-before-attempts'

interface BestBeforeModels {
  first: string
  second: string
}

interface RecognizeBestBeforeInput {
  recognizer: VisionRecognizer
  image: AiImage
  /** Modelle für Erst- und Zweitversuch, Standard siehe AI_ROLE_DEFAULT_MODELS */
  models: BestBeforeModels
}

export interface BestBeforeRecognition {
  answer: Result<BestBeforeAnswer, AiFailure>
  /** Ein oder zwei Aufrufe, in Reihenfolge */
  calls: AiCallRecord[]
}

/** Ein Fehler im ersten Versuch löst keinen Zweitversuch aus: Der Adapter wiederholt selbst (#59). */
export async function recognizeBestBefore({
  recognizer,
  image,
  models,
}: RecognizeBestBeforeInput): Promise<BestBeforeRecognition> {
  const first = await recognizer.recognize({ role: 'mhd', image, model: models.first, context: {} })
  if (!first.answer.ok || !needsSecondAttempt(first.answer.value)) {
    return { answer: first.answer, calls: [first.call] }
  }
  const second = await recognizer.recognize({
    role: 'mhd_zweitversuch',
    image,
    model: models.second,
    context: {},
  })
  const secondAnswer = second.answer.ok ? second.answer.value : null
  return {
    answer: ok(pickBestBeforeAnswer(first.answer.value, secondAnswer)),
    calls: [first.call, second.call],
  }
}
