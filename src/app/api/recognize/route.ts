// Erkennung auslösen (UMSETZUNG M6-06). Body: `{ fotoId }`. Antwort 200: der Vorschlag je Rolle
// (`role` plus `packaging`, `nutrition` oder `bestBefore`). Er wird nicht gespeichert, erst die
// Bestätigung in der Maske übernimmt ihn. Schätzungen laufen nicht hier, sondern nur auf
// ausdrückliche Wahl (#124, estimate-on-request).
import { requireCaptureActor } from '@/features/capture/application/capture-actor'
import { loadCaptureDeps } from '@/features/capture/application/capture-deps'
import { recognizePhoto } from '@/features/capture/application/recognize-photo'
import { recognizeRequestSchema } from '@/features/capture/schemas'
import { errorResponse, isCrossSiteRequest, noStoreJson, readJsonBody } from '@/shared/lib/http'
import { accessErrorResponse } from '../photos/access-error-response'
import { recognizeErrorResponse } from './recognize-error-response'

const MAX_BODY_BYTES = 1024

export async function POST(request: Request): Promise<Response> {
  if (isCrossSiteRequest(request)) return errorResponse(403, 'Nicht erlaubt.')
  const actor = await requireCaptureActor()
  if (!actor.ok) return accessErrorResponse(actor.error)
  const parsed = recognizeRequestSchema.safeParse(await readJsonBody(request, MAX_BODY_BYTES))
  if (!parsed.success) return errorResponse(400, 'Das Foto fehlt oder die Angabe passt nicht.')
  const result = await recognizePhoto(await loadCaptureDeps(), {
    actor: actor.value,
    photoId: parsed.data.fotoId,
  })
  return result.ok ? noStoreJson(result.value) : recognizeErrorResponse(result.error)
}
