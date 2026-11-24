// Antwort der Action „Erinnerungen speichern“ (#89). Eigene Datei, weil eine 'use server'-Datei nur
// Actions exportieren darf und das Formular den Startzustand braucht.

/** Eingaben des Formulars, wie sie ankamen. Sie bleiben nach einem Fehler stehen. */
export type ReminderFormValues = Readonly<{
  isWeeklySummaryEnabled: boolean
  weekday: string
  time: string
  isUrgentEnabled: boolean
}>

type ReminderField = 'weekday' | 'time'

export type ReminderFormState = Readonly<{
  status: 'idle' | 'saved' | 'error'
  message: string | null
  errors: Partial<Record<ReminderField, string>>
  values: ReminderFormValues | null
}>

export const REMINDER_FORM_IDLE: ReminderFormState = {
  status: 'idle',
  message: null,
  errors: {},
  values: null,
}
