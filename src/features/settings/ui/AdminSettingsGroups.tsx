import { USERS_PATH } from '@/shared/config/settings-paths'
import { Group } from '@/shared/ui/Group'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { NavRow } from '@/shared/ui/NavRow'

// Gruppe nur für Admins (#37): Nutzerverwaltung. Mitglieder sehen sie nicht, die Seiten dahinter
// antworten ihnen mit „nicht gefunden“. Daten & System sehen alle (SystemSettingsGroup, #217).
export function AdminSettingsGroups() {
  return (
    <>
      <GroupHeader id="bereiche-nutzerverwaltung">Nutzerverwaltung</GroupHeader>
      <Group labelledBy="bereiche-nutzerverwaltung">
        <NavRow title="Nutzer und Anmeldung" href={USERS_PATH} />
      </Group>
    </>
  )
}
