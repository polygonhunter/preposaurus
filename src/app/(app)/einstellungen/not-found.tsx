import { SETTINGS_PATH } from '@/shared/config/settings-paths'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'

// Unbekannte Person, oder ein Bereich nur für Admins (#37). Die Antwort sagt nicht, welches von beiden.
export default function SettingsNotFound() {
  return (
    <>
      <PageHeader title="Nicht gefunden" back={{ href: SETTINGS_PATH, label: 'Einstellungen' }} />
      <EmptyState
        text="Diese Seite gibt es hier nicht."
        action={{ href: SETTINGS_PATH, label: 'Zu den Einstellungen' }}
      />
    </>
  )
}
