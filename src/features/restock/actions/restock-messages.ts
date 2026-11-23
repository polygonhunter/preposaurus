// Gemeinsame Antwortform der Nachkaufen-Actions: Erwartete Fehler kommen als ruhiger deutscher Satz
// zurück, den die Oberfläche am Ort der Aktion zeigt (UX-Konzept §7).
export type RestockActionResult = Readonly<{ ok: true }> | Readonly<{ ok: false; message: string }>

export const ACCESS_MESSAGE = 'Bitte zuerst anmelden.'

export const GONE_MESSAGE = 'Diesen Eintrag gibt es nicht mehr. Die Liste ist jetzt neu geladen.'
