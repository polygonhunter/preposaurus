// Schemas der Erinnerungen (#89): Formular „Erinnerungen“ des Haushalts. Die Felder bleiben flach,
// damit Fehler am Feld stehen; toReminderSettings bringt sie in die Form der Fachlogik.
import { z } from 'zod'

const ISO_MONDAY = 1
const ISO_SUNDAY = 7
const WEEKDAY_ERROR = 'Bitte einen Wochentag wählen.'
// Das Uhrzeit-Feld des Browsers schickt „HH:MM“
const TIME_OF_DAY = /^([01]\d|2[0-3]):[0-5]\d$/

export const reminderFormSchema = z.object({
  isWeeklySummaryEnabled: z.boolean(),
  weekday: z.coerce
    .number({ error: WEEKDAY_ERROR })
    .int({ error: WEEKDAY_ERROR })
    .min(ISO_MONDAY, { error: WEEKDAY_ERROR })
    .max(ISO_SUNDAY, { error: WEEKDAY_ERROR }),
  time: z.string().regex(TIME_OF_DAY, { error: 'Bitte eine Uhrzeit wie 10:00 eintragen.' }),
  isUrgentEnabled: z.boolean(),
})

export type ReminderFormInput = z.infer<typeof reminderFormSchema>

/** Form von ReminderSettings (domain/) */
export function toReminderSettings(values: ReminderFormInput) {
  return {
    weeklySummary: {
      isEnabled: values.isWeeklySummaryEnabled,
      weekday: values.weekday,
      time: values.time,
    },
    isUrgentEnabled: values.isUrgentEnabled,
  }
}
