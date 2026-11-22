// Erkennung auslösen (UMSETZUNG M6-06): nur für ein Foto aus dem eigenen Entwurf, nur bei
// `ki_aktiv` und eingerichteter Rolle. Jeder Aufruf landet über prepareRecognition in `ki_aufruf`,
// auch Fehlschläge. Gleichzeitige Aufrufe begrenzt der Adapter je Serverprozess. Scheitert die
// Erkennung, bleibt die Maske, wie sie ist: Die Oberfläche zeigt einen ruhigen Hinweis und die
// manuelle Eingabe, bisherige Eingaben gehen nicht verloren. Hier wird nur gelesen, nie
// geschätzt (#124: Schätzungen nur auf ausdrückliche Wahl über estimate-on-request).
import 'server-only'
import type { AiConfigError } from '@/features/ai-settings/application/ai-config-service'
import { prepareRecognition } from '@/features/ai-settings/application/prepare-recognition'
import type { AiFailure } from '@/server/ai/vision-recognizer'
import { err, type Result } from '@/shared/lib/result'
import { loadFoodTypeOptions } from '../data/food-type-options'
import { findOwnDraftPhoto } from '../data/photo-repository'
import type { CaptureActor } from './capture-actor'
import type { CaptureDeps } from './capture-deps'
import { photoKeysFor } from './photo-files'
import { runRecognitionTask, type RecognitionSuggestion } from './photo-recognition-roles'

interface RecognizePhotoInput {
  actor: CaptureActor
  photoId: string
}

export type RecognizeError =
  | { kind: 'not-found' }
  | { kind: 'ai-unavailable'; reason: AiConfigError['kind'] }
  | { kind: 'ai-failed'; failure: AiFailure['kind'] }

type RecognizeDeps = Pick<CaptureDeps, 'db' | 'storage' | 'env'>

/** Fehler von prepareRecognition. Ein fremdes Foto (#168) ist für den Nutzer „nicht gefunden“. */
function unavailable(error: AiConfigError | { kind: 'photo-not-found' }): RecognizeError {
  return error.kind === 'photo-not-found'
    ? { kind: 'not-found' }
    : { kind: 'ai-unavailable', reason: error.kind }
}

export async function recognizePhoto(
  deps: RecognizeDeps,
  input: RecognizePhotoInput,
): Promise<Result<RecognitionSuggestion, RecognizeError>> {
  const photo = await findOwnDraftPhoto(deps.db, input.actor, input.photoId)
  if (photo === null) return err({ kind: 'not-found' })
  const { householdId, role } = photo
  const prepared = await prepareRecognition(deps, {
    householdId,
    photoId: photo.id,
    required: [role],
    // Der MHD-Zweitversuch ist optional: Ist die Rolle aus, bleibt es beim ersten Versuch.
    optional: role === 'mhd' ? ['mhd_zweitversuch'] : [],
  })
  if (!prepared.ok) return err(unavailable(prepared.error))
  const data = await deps.storage.read(photoKeysFor({ householdId, photoId: photo.id }).full)
  if (data === null) return err({ kind: 'not-found' })
  // Der Upload speichert immer JPEG (photo-processor), die DB-Spalte braucht es hier nicht.
  const image = { data, mimeType: 'image/jpeg' } as const
  const loadFoodTypes = () => loadFoodTypeOptions(deps.db, householdId)
  const result = await runRecognitionTask({ prepared: prepared.value, image, loadFoodTypes }, role)
  return result.ok ? result : err({ kind: 'ai-failed', failure: result.error.kind })
}
