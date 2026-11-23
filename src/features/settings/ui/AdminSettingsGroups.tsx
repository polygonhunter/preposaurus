import { USERS_PATH } from '@/shared/config/settings-paths'
import { Group } from '@/shared/ui/Group'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { Row } from '@/shared/ui/Row'

// Gruppe nur für Admins (#37): Nutzerverwaltung. Mitglieder sehen sie nicht, die Seiten dahinter
// antworten ihnen mit „nicht gefunden“. Daten & System sehen alle (SystemSettingsGroup, #217).
export function AdminSettingsGroups() {
  return (
    <>
      <GroupHeader id="nutzerverwaltung">Nutzerverwaltung</GroupHeader>
      <Group labelledBy="nutzerverwaltung">
        <Row title="Nutzer und Anmeldung" action={{ href: USERS_PATH }} />
      </Group>
    </>
  )
}
