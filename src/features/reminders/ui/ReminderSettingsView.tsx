import { Group } from '@/shared/ui/Group'
import { GroupFooter } from '@/shared/ui/GroupFooter'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { Row } from '@/shared/ui/Row'
import type { ReminderSettings } from '../domain/reminder-settings'
import { URGENT_EXPLANATION, WEEKLY_SUMMARY_EXPLANATION } from './reminder-explanations'
import { formatWeeklySchedule } from './reminder-format'

type ReminderSettingsViewProps = Readonly<{ settings: ReminderSettings }>

// Erinnerungen lesend für Mitglieder (#89, UX §7 „Keine Berechtigung“): dieselben Werte und
// Erklärungen wie im Formular des Admins, ohne Schalter.
export function ReminderSettingsView({ settings }: ReminderSettingsViewProps) {
  const { weeklySummary, isUrgentEnabled } = settings
  return (
    <>
      <GroupHeader id="wochenuebersicht">Wochenübersicht</GroupHeader>
      <Group labelledBy="wochenuebersicht">
        <Row
          title="Wochenübersicht"
          trailing={weeklySummary.isEnabled ? formatWeeklySchedule(weeklySummary) : 'aus'}
        />
      </Group>
      <GroupFooter>{WEEKLY_SUMMARY_EXPLANATION}</GroupFooter>
      <GroupHeader id="dringend">Dringend</GroupHeader>
      <Group labelledBy="dringend">
        <Row title="Dringend" trailing={isUrgentEnabled ? 'an' : 'aus'} />
      </Group>
      <GroupFooter>{URGENT_EXPLANATION}</GroupFooter>
      <GroupFooter>Das ändert ein Admin.</GroupFooter>
    </>
  )
}
