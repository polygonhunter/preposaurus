// Gemeinsame Antwortform der Vorrat-Actions: Erwartete Fehler kommen als ruhiger deutscher Satz
// zurück, den die Oberfläche am Ort der Aktion zeigt (UX-Konzept §7).
import type { TakeOutError } from '../application/take-out-unit'

export type ActionFailure = Readonly<{ ok: false; message: string }>

export const ACCESS_MESSAGE = 'Bitte zuerst anmelden.'

export const GONE_RELOADED = 'Diese Packung gibt es nicht mehr. Die Liste ist jetzt neu geladen.'

/** Fehler nach „Verbraucht“ oder „Entsorgt“ für eine bestimmte Packung. */
export function takeOutMessage(error: TakeOutError): string {
  switch (error.kind) {
    case 'not-found':
      return GONE_RELOADED
    case 'not-in-stock':
      return 'Diese Packung ist schon entnommen.'
  }
}
