// Ergebnis von „Verbindung testen“ (#108): Status für die Spalte letzter_test_status und ein
// ruhiger, verständlicher Satz für die Oberfläche. Der Satz nennt nie den Schlüssel.
import type { AiFailure } from '@/server/ai/vision-recognizer'
import type { ConnectionTestStatus } from '../data/ai-settings-repository'

export type TestOutcomeKind = AiFailure['kind'] | 'ok' | 'key-unreadable'

export interface ConnectionTestResult {
  status: ConnectionTestStatus
  message: string
}

const RESULTS: Readonly<Record<TestOutcomeKind, ConnectionTestResult>> = {
  ok: { status: 'ok', message: 'Die Verbindung funktioniert.' },
  'invalid-key': {
    status: 'schluessel_ungueltig',
    message: 'Der Schlüssel wird nicht angenommen. Bitte prüfen und neu eintragen.',
  },
  'key-unreadable': {
    status: 'schluessel_ungueltig',
    message:
      'Der gespeicherte Schlüssel lässt sich nicht mehr lesen, vermutlich hat sich APP_SECRET ' +
      'geändert. Bitte den Schlüssel neu eintragen.',
  },
  'no-credit': {
    status: 'kein_guthaben',
    message: 'Beim Anbieter fehlt Guthaben. Nach dem Aufladen einfach noch einmal testen.',
  },
  timeout: {
    status: 'zeitueberschreitung',
    message: 'Der Anbieter hat nicht rechtzeitig geantwortet. Bitte später noch einmal testen.',
  },
  'rate-limited': {
    status: 'fehler',
    message: 'Der Anbieter bremst gerade die Anfragen. Bitte in einer Minute noch einmal testen.',
  },
  'invalid-response': {
    status: 'fehler',
    message: 'Der Anbieter hat unerwartet geantwortet. Bitte später noch einmal testen.',
  },
  'provider-error': {
    status: 'fehler',
    message:
      'Der Anbieter meldet einen Fehler, z. B. ein unbekanntes Modell oder eine Störung. ' +
      'Bitte Modell prüfen und später noch einmal testen.',
  },
}

export const connectionTestResult = (kind: TestOutcomeKind): ConnectionTestResult => RESULTS[kind]
