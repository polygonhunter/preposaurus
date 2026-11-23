// Gemeinsame Zustände der Stammdaten-Formulare (EIN-04). Ein Fehler steht am Feld, die Eingabe
// behält das Formular, damit nach einem Fehler nichts verloren geht.

export type NameFormState = Readonly<{
  status: 'idle' | 'saved' | 'error'
  /** Fehler am Namensfeld */
  fieldError: string | null
  /** Rückmeldung unter dem Formular, z. B. „Gespeichert.“ oder „Das ändert ein Admin.“ */
  message: string | null
  name: string
}>

export const NAME_FORM_IDLE: NameFormState = {
  status: 'idle',
  fieldError: null,
  message: null,
  name: '',
}

export const nameFieldError = (name: string, fieldError: string): NameFormState => ({
  status: 'error',
  fieldError,
  message: null,
  name,
})

export const formMessageError = (name: string, message: string): NameFormState => ({
  status: 'error',
  fieldError: null,
  message,
  name,
})

/** Antwort der Löschen-Blätter */
export type RemoveState = Readonly<{ message: string | null }>

export const REMOVE_IDLE: RemoveState = { message: null }
