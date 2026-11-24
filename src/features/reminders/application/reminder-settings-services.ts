// Verdrahtung für Seite, Liste und Action der Erinnerungen (#89): Repositories auf der Verbindung
// des Serverprozesses und ob Mails eingerichtet sind. Die Use-Cases bleiben mit Fakes testbar.
import 'server-only'
import { getDb } from '@/server/db/get-db'
import { loadEnv } from '@/shared/config/env'
import { createReminderRepository } from '../data/reminder-repository'
import { createReminderSettingsRepository } from '../data/reminder-settings-repository'
import type { ReminderRepository } from './reminder-repository'
import type { ReminderSettingsStore } from './reminder-settings'

type ReminderSettingsServices = Readonly<{
  settings: ReminderSettingsStore
  repository: Pick<ReminderRepository, 'listAddresses'>
  /** SMTP_HOST gesetzt: Ohne Push geht die Wochenübersicht dann per Mail */
  isMailConfigured: boolean
}>

export async function reminderSettingsServices(): Promise<ReminderSettingsServices> {
  const db = await getDb()
  return {
    settings: createReminderSettingsRepository(db),
    repository: createReminderRepository(db),
    isMailConfigured: loadEnv().SMTP_HOST !== undefined,
  }
}
