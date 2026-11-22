// Gemeinsame Antwortform der Vorrat-Actions: Erwartete Fehler kommen als ruhiger deutscher Satz
// zurück, den die Oberfläche am Ort der Aktion zeigt (UX-Konzept §7).
export type ActionFailure = Readonly<{ ok: false; message: string }>

export const ACCESS_MESSAGE = 'Bitte zuerst anmelden.'
