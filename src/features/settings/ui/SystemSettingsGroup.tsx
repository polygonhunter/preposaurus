import { SYSTEM_PATH } from '@/shared/config/settings-paths'
import { Group } from '@/shared/ui/Group'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { Row } from '@/shared/ui/Row'

// Daten & System für alle Angemeldeten (#217): Die AGPL verlangt, dass jede Person, die die App
// über das Netz nutzt, den Quelltext angeboten bekommt. Admin-Teile (Export, SYS-01) prüfen die
// Rolle auf ihrer eigenen Seite.
export function SystemSettingsGroup() {
  return (
    <>
      <GroupHeader id="daten-system">Daten & System</GroupHeader>
      <Group labelledBy="daten-system">
        <Row title="Lizenz und Quellen" action={{ href: SYSTEM_PATH }} />
      </Group>
    </>
  )
}
