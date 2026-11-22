// Gemeinsame Rückgabe der Entwurfs-Actions: Erfolg mit Daten oder ein ruhiger Satz für die Maske.
import type { CaptureAccessError } from '../application/capture-actor'

export type DraftActionState<T extends object> = ({ ok: true } & T) | { ok: false; message: string }

export const DRAFT_GONE = 'Diese Erfassung gibt es nicht mehr. Bitte neu beginnen.'

export function failure(message: string): { ok: false; message: string } {
  return { ok: false, message }
}

export function accessMessage(error: CaptureAccessError): string {
  switch (error.kind) {
    case 'unauthenticated':
      return 'Bitte melde dich an.'
    case 'forbidden':
      return 'Dafür gehört dein Konto zu keinem Haushalt.'
  }
}
