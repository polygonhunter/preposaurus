// Fehlerantworten der Erkennung. `grund` lässt die Oberfläche z. B. bei „ausgeschaltet“ gar nicht
// erst wieder fragen. Die Texte stehen bei den Actions, weil die Schätzung sie ebenso braucht.
import { failedMessage, unavailableMessage } from '@/features/capture/actions/ai-messages'
import type { RecognizeError } from '@/features/capture/application/recognize-photo'
import { errorResponse } from '@/shared/lib/http'

export function recognizeErrorResponse(error: RecognizeError): Response {
  switch (error.kind) {
    case 'not-found':
      return errorResponse(404, 'Dieses Foto gehört zu keiner offenen Erfassung.')
    case 'ai-unavailable':
      return errorResponse(503, unavailableMessage(error.reason), error.reason)
    case 'ai-failed':
      return errorResponse(502, failedMessage(error.failure), error.failure)
  }
}
