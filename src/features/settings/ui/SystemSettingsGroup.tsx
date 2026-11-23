import { AI_SETTINGS_PATH, SYSTEM_PATH } from '@/shared/config/settings-paths'
import { Group } from '@/shared/ui/Group'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { Row } from '@/shared/ui/Row'

type SystemSettingsGroupProps = Readonly<{ isAdmin: boolean }>

// Daten & System für alle Angemeldeten (#217): Die AGPL verlangt, dass jede Person, die die App
// über das Netz nutzt, den Quelltext angeboten bekommt. Die Foto-Erkennung (#108) sieht nur der
// Admin; ihre Seite und künftige Admin-Teile (Export, SYS-01) prüfen die Rolle selbst.
export function SystemSettingsGroup({ isAdmin }: SystemSettingsGroupProps) {
  return (
    <>
      <GroupHeader id="daten-system">Daten & System</GroupHeader>
      <Group labelledBy="daten-system">
        {isAdmin ? <Row title="Foto-Erkennung" action={{ href: AI_SETTINGS_PATH }} /> : null}
        <Row title="Lizenz und Quellen" action={{ href: SYSTEM_PATH }} />
      </Group>
    </>
  )
}
