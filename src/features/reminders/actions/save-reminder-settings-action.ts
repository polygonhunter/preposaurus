'use server'
// Erinnerungen des Haushalts speichern (#89), nur der Admin. Ein Schalter schickt „an“, wenn er an
// ist, und sonst nichts. Fehler stehen am Feld, die Eingaben behält das Formular. refresh() zeichnet
// danach Seite und Liste der Einstellungen (Layout) mit dem gespeicherten Stand neu.
import { refresh } from 'next/cache'
import { z } from 'zod'
import { adminAccessMessage } from '@/server/auth/admin-access-message'
import { requireHouseholdAdmin } from '@/server/auth/guards'
import { firstMessages, readFormText } from '@/shared/lib/form-data'
import { saveReminderSettings } from '../application/reminder-settings'
import { reminderSettingsServices } from '../application/reminder-settings-services'
import { reminderFormSchema, toReminderSettings } from '../schemas'
import type { ReminderFormState, ReminderFormValues } from './reminder-form-state'

const readForm = (formData: FormData): ReminderFormValues => ({
  isWeeklySummaryEnabled: readFormText(formData, 'wochenuebersicht') === 'an',
  weekday: readFormText(formData, 'wochentag'),
  time: readFormText(formData, 'uhrzeit'),
  isUrgentEnabled: readFormText(formData, 'dringend') === 'an',
})

export async function saveReminderSettingsAction(
  _previous: ReminderFormState,
  formData: FormData,
): Promise<ReminderFormState> {
  const values = readForm(formData)
  const admin = await requireHouseholdAdmin()
  if (!admin.ok) {
    return { status: 'error', message: adminAccessMessage(admin.error), errors: {}, values }
  }
  const parsed = reminderFormSchema.safeParse(values)
  if (!parsed.success) {
    const errors = firstMessages(z.flattenError(parsed.error).fieldErrors)
    return { status: 'error', message: null, errors, values }
  }
  await saveReminderSettings(await reminderSettingsServices(), {
    householdId: admin.value.householdId,
    settings: toReminderSettings(parsed.data),
  })
  refresh()
  return { status: 'saved', message: 'Gespeichert.', errors: {}, values }
}
