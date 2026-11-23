// Ruhige Hinweise, wenn die KI nicht hilft (Erkennung und Schätzung). Die Maske bleibt, wie sie
// ist, und bietet immer die Eingabe von Hand an. Reine Texte ohne 'use server', die auch die Route
// /api/recognize nutzt.
import type { DraftPhotoError } from '../application/prepare-draft-photo'
import type { RecognizeError } from '../application/recognize-photo'

const BY_HAND = 'Du kannst die Angaben von Hand eintragen.'

type UnavailableReason = Extract<DraftPhotoError, { kind: 'ai-unavailable' }>['reason']
type FailureKind = Extract<RecognizeError, { kind: 'ai-failed' }>['failure']

export function unavailableMessage(reason: UnavailableReason): string {
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

export function failedMessage(failure: FailureKind): string {
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
