// MHD erkennen mit automatischem Zweitversuch (#114, DATENKATALOG §8.3): Liefert die Rolle `mhd`
// Sicherheit „niedrig“, kein Datum oder eine Antwort außerhalb des Schemas, folgt ein Versuch mit
// `mhd_zweitversuch` (stärkeres Modell), sofern diese Rolle aktiv ist. Beide Aufrufe kommen
// zurück, damit beide im Protokoll `ki_aufruf` landen (Reihenfolge = Versuch 1 und 2).
import 'server-only'
import type {
  AiImage,
  AiCallRecord,
  AiFailure,
  RecognitionOutcome,
  VisionRecognizer,
} from '@/server/ai/vision-recognizer'
import { err, ok, type Result } from '@/shared/lib/result'
import {
  mergeAttempts,
  needsSecondAttempt,
  type MergedBestBefore,
} from '../domain/best-before-attempts'

interface BestBeforeModels {
  first: string
  /** Modell der Rolle `mhd_zweitversuch`, null wenn die Rolle nicht aktiv ist */
  second: string | null
}

interface RecognizeBestBeforeInput {
  recognizer: VisionRecognizer
  image: AiImage
  /** Modelle für Erst- und Zweitversuch, Standard siehe AI_ROLE_DEFAULT_MODELS */
  models: BestBeforeModels
}

export interface BestBeforeRecognition {
  result: Result<MergedBestBefore, AiFailure>
  /** Ein oder zwei Aufrufe, in Reihenfolge */
  calls: AiCallRecord[]
}

/**
 * Ein Schema-Verstoß heißt faktisch „kein Datum“ und löst den Zweitversuch aus. Zeitlimit und
 * andere Fehler nicht, sonst kostet ein Ausfall doppelt. Dort wiederholt der Adapter selbst (#59).
 */
function shouldRetry(first: RecognitionOutcome<'mhd'>): boolean {
  if (first.answer.ok) return needsSecondAttempt(first.answer.value)
  return first.answer.error.kind === 'invalid-response'
}

function withoutRetry(first: RecognitionOutcome<'mhd'>): BestBeforeRecognition {
  const result = first.answer.ok
    ? ok({ answer: first.answer.value, conflictingDate: null })
    : first.answer
  return { result, calls: [first.call] }
}

export async function recognizeBestBefore({
  recognizer,
  image,
  models,
}: RecognizeBestBeforeInput): Promise<BestBeforeRecognition> {
  const first = await recognizer.recognize({ role: 'mhd', image, model: models.first, context: {} })
  if (models.second === null || !shouldRetry(first)) return withoutRetry(first)
  const second = await recognizer.recognize({
    role: 'mhd_zweitversuch',
    image,
    model: models.second,
    context: {},
  })
  const merged = mergeAttempts(
    first.answer.ok ? first.answer.value : null,
    second.answer.ok ? second.answer.value : null,
  )
  const failure = first.answer.ok ? null : first.answer.error
  return {
    result: merged === null ? err(failure ?? { kind: 'provider-error' }) : ok(merged),
    calls: [first.call, second.call],
  }
}
