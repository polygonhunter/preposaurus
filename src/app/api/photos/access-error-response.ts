// Gemeinsame Antworten der Foto-Routen, wenn Sitzung oder Haushalt fehlen. Texte wie in den Actions.
import { accessMessage } from '@/features/capture/actions/action-messages'
import type { CaptureAccessError } from '@/features/capture/application/capture-actor'
import { errorResponse } from '@/shared/lib/http'

export function accessErrorResponse(error: CaptureAccessError): Response {
  const status = error.kind === 'unauthenticated' ? 401 : 403
  return errorResponse(status, accessMessage(error))
}
