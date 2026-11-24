// Erinnerungen des Haushalts in haushalt_einstellung (#89). Fehlt die Zeile (alte Daten), liefert
// read null (der Use-Case nimmt die Standards), und das erste Speichern legt sie an. Die Merker
// „zuletzt gesendet“ bleiben beim Speichern unberührt, sonst käme eine schon gesendete Nachricht
// am selben Tag erneut.
import 'server-only'
import { eq } from 'drizzle-orm'
import type { ReminderSettings } from '@/features/reminders/domain/reminder-settings'
import type { Database } from '@/server/db/connection'
import { householdSettings } from '@/server/db/schema/household'

const toColumns = ({ weeklySummary, isUrgentEnabled }: ReminderSettings) => ({
  weeklySummaryEnabled: weeklySummary.isEnabled,
  weeklySummaryWeekday: weeklySummary.weekday,
  weeklySummaryTime: weeklySummary.time,
  urgentEnabled: isUrgentEnabled,
})

async function readSettings(db: Database, householdId: string): Promise<ReminderSettings | null> {
  const [row] = await db
    .select({
      isEnabled: householdSettings.weeklySummaryEnabled,
      weekday: householdSettings.weeklySummaryWeekday,
      time: householdSettings.weeklySummaryTime,
      isUrgentEnabled: householdSettings.urgentEnabled,
    })
    .from(householdSettings)
    .where(eq(householdSettings.householdId, householdId))
  if (row === undefined) return null
  const { isUrgentEnabled, ...weeklySummary } = row
  return { weeklySummary, isUrgentEnabled }
}

async function saveSettings(db: Database, householdId: string, settings: ReminderSettings) {
  const columns = toColumns(settings)
  await db
    .insert(householdSettings)
    .values({ householdId, ...columns })
    .onConflictDoUpdate({ target: householdSettings.householdId, set: columns })
}

export function createReminderSettingsRepository(db: Database) {
  return {
    read: (householdId: string) => readSettings(db, householdId),
    save: (householdId: string, settings: ReminderSettings) =>
      saveSettings(db, householdId, settings),
  }
}
