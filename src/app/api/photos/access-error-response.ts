// Gemeinsame Antworten der Foto-Routen, wenn Sitzung oder Haushalt fehlen.
import type { CaptureAccessError } from '@/features/capture/application/capture-actor'
import { errorResponse } from '@/shared/lib/http'

export function accessErrorResponse(error: CaptureAccessError): Response {
  switch (error.kind) {
    case 'unauthenticated':
      return errorResponse(401, 'Bitte melde dich an.')
    case 'forbidden':
    case 'no-household':
      return errorResponse(403, 'Dafür gehört dein Konto zu keinem Haushalt.')
  }
}
