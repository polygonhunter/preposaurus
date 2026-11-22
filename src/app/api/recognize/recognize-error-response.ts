// Ruhige Hinweise, wenn die Erkennung nicht hilft. Die Maske bleibt, wie sie ist, und bietet die
// manuelle Eingabe an. `grund` lässt die Oberfläche z. B. bei „ausgeschaltet“ gar nicht erst fragen.
import type { RecognizeError } from '@/features/capture/application/recognize-photo'
import { errorResponse } from '@/shared/lib/http'

const BY_HAND = 'Du kannst die Angaben von Hand eintragen.'

function unavailableMessage(reason: Extract<RecognizeError, { kind: 'ai-unavailable' }>['reason']) {
  switch (reason) {
    case 'ai-disabled':
      return `Die Foto-Erkennung ist ausgeschaltet. ${BY_HAND}`
    case 'key-unreadable':
      return `Der KI-Schlüssel muss in den Einstellungen neu eingetragen werden. ${BY_HAND}`
    case 'role-inactive':
    case 'not-configured':
    case 'connection-inactive':
      return `Die Foto-Erkennung ist dafür nicht eingerichtet. ${BY_HAND}`
  }
}

function failedMessage(failure: Extract<RecognizeError, { kind: 'ai-failed' }>['failure']) {
  switch (failure) {
    case 'timeout':
      return `Die Erkennung hat zu lange gedauert. Versuch es noch einmal. ${BY_HAND}`
    case 'rate-limited':
      return `Gerade laufen zu viele Erkennungen. Versuch es gleich noch einmal. ${BY_HAND}`
    case 'invalid-key':
    case 'no-credit':
    case 'invalid-response':
    case 'provider-error':
      return `Die Erkennung hat diesmal nicht geklappt. ${BY_HAND}`
  }
}

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
