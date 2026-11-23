// Foto hochladen (UMSETZUNG M6-02). Body: das rohe Bild (JPEG, PNG, WebP, HEIC), der Typ wird am
// Dateianfang erkannt. Query: `rolle` und optional `entwurf`. Antwort 201: `{ fotoId, entwurfId }`.
import { requireCaptureActor } from '@/features/capture/application/capture-actor'
import { loadCaptureDeps } from '@/features/capture/application/capture-deps'
import { uploadPhoto, type UploadPhotoError } from '@/features/capture/application/upload-photo'
import { photoUploadQuerySchema } from '@/features/capture/schemas/photos'
import { errorResponse, isCrossSiteRequest, noStoreJson } from '@/shared/lib/http'
import { accessErrorResponse } from './access-error-response'

const MEGABYTE = 1024 * 1024

function uploadErrorResponse(error: UploadPhotoError): Response {
  switch (error.kind) {
    case 'empty':
      return errorResponse(400, 'Das Foto ist leer. Bitte noch einmal aufnehmen.')
    case 'too-large':
      return errorResponse(
        413,
        `Das Foto ist zu groß (höchstens ${String(error.maxBytes / MEGABYTE)} MB).`,
      )
    case 'unsupported-type':
      return errorResponse(415, 'Bitte ein Foto als JPEG, PNG, WebP oder HEIC wählen.')
    case 'unreadable':
      return errorResponse(422, 'Das Foto ließ sich nicht lesen. Bitte noch einmal aufnehmen.')
    case 'draft-not-found':
      return errorResponse(404, 'Diese Erfassung gibt es nicht mehr.')
  }
}

function readQuery(request: Request) {
  return photoUploadQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams))
}

export async function POST(request: Request): Promise<Response> {
  if (isCrossSiteRequest(request)) return errorResponse(403, 'Nicht erlaubt.')
  const actor = await requireCaptureActor()
  if (!actor.ok) return accessErrorResponse(actor.error)
  const query = readQuery(request)
  if (!query.success) return errorResponse(400, 'Rolle oder Erfassung fehlt oder passt nicht.')
  const result = await uploadPhoto(await loadCaptureDeps(), {
    actor: actor.value,
    role: query.data.rolle,
    draftId: query.data.entwurf ?? null,
    body: request.body,
  })
  if (!result.ok) return uploadErrorResponse(result.error)
  return noStoreJson({ fotoId: result.value.photoId, entwurfId: result.value.draftId }, 201)
}
