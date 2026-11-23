// Gemeinsame Antwortform der Nachkaufen-Actions: Erwartete Fehler kommen als ruhiger deutscher Satz
// zurück, den die Oberfläche am Ort der Aktion zeigt (UX-Konzept §7). Ein Erfolg kann Daten für die
// Rückgängig-Zeile mitbringen.
export type RestockActionFailure = Readonly<{ ok: false; message: string }>

export type RestockActionResult<T extends object = object> =
  Readonly<{ ok: true } & T> | RestockActionFailure

export const ACCESS_MESSAGE = 'Bitte zuerst anmelden.'

export const GONE_MESSAGE = 'Diesen Eintrag gibt es nicht mehr. Die Liste ist jetzt neu geladen.'
