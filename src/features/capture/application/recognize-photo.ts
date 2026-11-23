// Erkennung auslösen (UMSETZUNG M6-06): nur für ein Foto aus dem eigenen Entwurf, nur bei
// `ki_aktiv` und eingerichteter Rolle. Jeder Aufruf landet über prepareRecognition in `ki_aufruf`,
// auch Fehlschläge. Gleichzeitige Aufrufe begrenzt der Adapter je Serverprozess. Scheitert die
// Erkennung, bleibt die Maske, wie sie ist: Die Oberfläche zeigt einen ruhigen Hinweis und die
// manuelle Eingabe, bisherige Eingaben gehen nicht verloren. Hier wird nur gelesen, nie
// geschätzt (#124: Schätzungen nur auf ausdrückliche Wahl über estimate-on-request).
import 'server-only'
import type { AiFailure } from '@/server/ai/vision-recognizer'
import { err, type Result } from '@/shared/lib/result'
import { loadFoodTypeOptions } from '../data/food-type-options'
import type { CaptureActor } from './capture-actor'
import type { CaptureDeps } from './capture-deps'
import { runRecognitionTask, type RecognitionSuggestion } from './photo-recognition-roles'
import { prepareDraftPhoto, type DraftPhotoError } from './prepare-draft-photo'

interface RecognizePhotoInput {
  actor: CaptureActor
  photoId: string
}

export type RecognizeError = DraftPhotoError | { kind: 'ai-failed'; failure: AiFailure['kind'] }

type RecognizeDeps = Pick<CaptureDeps, 'db' | 'storage' | 'env'>

export async function recognizePhoto(
  deps: RecognizeDeps,
  input: RecognizePhotoInput,
): Promise<Result<RecognitionSuggestion, RecognizeError>> {
  const ready = await prepareDraftPhoto(deps, {
    ...input,
    // Der MHD-Zweitversuch ist optional: Ist die Rolle aus, bleibt es beim ersten Versuch.
    rolesFor: ({ role }) => ({
      required: [role],
      optional: role === 'mhd' ? ['mhd_zweitversuch'] : [],
    }),
  })
  if (!ready.ok) return ready
  const { photo, prepared, image } = ready.value
  const loadFoodTypes = () => loadFoodTypeOptions(deps.db, photo.householdId)
  const result = await runRecognitionTask({ prepared, image, loadFoodTypes }, photo.role)
  return result.ok ? result : err({ kind: 'ai-failed', failure: result.error.kind })
}
