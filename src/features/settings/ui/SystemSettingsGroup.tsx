import { AI_SETTINGS_PATH, SYSTEM_PATH } from '@/shared/config/settings-paths'
import { Group } from '@/shared/ui/Group'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { NavRow } from '@/shared/ui/NavRow'

type SystemSettingsGroupProps = Readonly<{ isAdmin: boolean }>

// Daten & System für alle Angemeldeten (#217): Die AGPL verlangt, dass jede Person, die die App
// über das Netz nutzt, den Quelltext angeboten bekommt. Die Foto-Erkennung (#108) sieht nur der
// Admin; ihre Seite, Export (#80) und letzte Sicherung (#147) prüfen die Rolle selbst.
export function SystemSettingsGroup({ isAdmin }: SystemSettingsGroupProps) {
  return (
    <>
      <GroupHeader id="bereiche-daten-system">Daten & System</GroupHeader>
      <Group labelledBy="bereiche-daten-system">
        {isAdmin ? <NavRow title="Foto-Erkennung" href={AI_SETTINGS_PATH} /> : null}
        <NavRow
          title={isAdmin ? 'Sicherung, Export und Lizenz' : 'Lizenz und Quellen'}
          href={SYSTEM_PATH}
        />
      </Group>
    </>
  )
}
