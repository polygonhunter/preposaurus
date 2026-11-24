import type { Metadata } from 'next'
import {
  getReminderDelivery,
  getReminderSettings,
} from '@/features/reminders/application/reminder-settings'
import { reminderSettingsServices } from '@/features/reminders/application/reminder-settings-services'
import { ReminderDeliveryGroup } from '@/features/reminders/ui/ReminderDeliveryGroup'
import { ReminderSettingsForm } from '@/features/reminders/ui/ReminderSettingsForm'
import { ReminderSettingsView } from '@/features/reminders/ui/ReminderSettingsView'
import { requirePageHousehold } from '@/server/auth/household'
import { SETTINGS_PATH } from '@/shared/config/settings-paths'
import { PageHeader } from '@/shared/ui/PageHeader'

export const metadata: Metadata = { title: 'Erinnerungen · Preposaurus' }

// Erinnerungen des Haushalts (ERI-02, ERI-03, ERI-07, #89): Wochenübersicht und „Dringend“ gelten
// für alle im Haushalt (EINSTELLUNGEN_NUTZER §1.5). Der Admin ändert, Mitglieder sehen die Werte
// lesend. Darunter, wie sie ankommen; Push je Gerät folgt mit #86.
export default async function RemindersPage() {
  const { householdId, isAdmin } = await requirePageHousehold()
  const services = await reminderSettingsServices()
  const [settings, delivery] = await Promise.all([
    getReminderSettings(services, householdId),
    getReminderDelivery(services, householdId),
  ])
  return (
    <>
      <PageHeader title="Erinnerungen" back={{ href: SETTINGS_PATH, label: 'Einstellungen' }} />
      {isAdmin ? (
        <ReminderSettingsForm settings={settings} />
      ) : (
        <ReminderSettingsView settings={settings} />
      )}
      <ReminderDeliveryGroup delivery={delivery} />
    </>
  )
}
