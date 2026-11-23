import { AI_SETTINGS_PATH, SYSTEM_PATH, USERS_PATH } from '@/shared/config/settings-paths'
import { Group } from '@/shared/ui/Group'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { Row } from '@/shared/ui/Row'

// Gruppen nur für Admins (#37): Nutzerverwaltung und Daten & System. Mitglieder sehen sie nicht,
// die Seiten dahinter antworten ihnen mit „nicht gefunden“.
export function AdminSettingsGroups() {
  return (
    <>
      <GroupHeader id="nutzerverwaltung">Nutzerverwaltung</GroupHeader>
      <Group labelledBy="nutzerverwaltung">
        <Row title="Nutzer und Anmeldung" action={{ href: USERS_PATH }} />
      </Group>
      <GroupHeader id="daten-system">Daten & System</GroupHeader>
      <Group labelledBy="daten-system">
        <Row title="Foto-Erkennung" action={{ href: AI_SETTINGS_PATH }} />
        <Row title="Lizenz und Quellen" action={{ href: SYSTEM_PATH }} />
      </Group>
    </>
  )
}
