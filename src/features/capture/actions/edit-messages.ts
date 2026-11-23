// Gemeinsame Antwortform von „Angaben bearbeiten“ und „Datum ändern“ (#49): gespeichert, evtl. mit
// dem Ziel, zu dem die Oberfläche danach wechselt, oder ein ruhiger Satz samt Meldungen je Feld.

type EditFailure = Readonly<{
  status: 'error'
  message: string
  fieldErrors: Readonly<Record<string, string[]>>
}>

export type EditActionState<Saved extends object = object> =
  (Readonly<{ status: 'saved' }> & Saved) | EditFailure

export const failure = (
  message: string,
  fieldErrors: Record<string, string[]> = {},
): EditFailure => ({
  status: 'error',
  message,
  fieldErrors,
})

export const SESSION_MESSAGE = 'Bitte melde dich erneut an.'
