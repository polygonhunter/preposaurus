import type { Metadata } from 'next'
import { requirePageHousehold } from '@/server/auth/household'
import { GOAL_PATH, SETTINGS_PATH } from '@/shared/config/settings-paths'
import { Group } from '@/shared/ui/Group'
import { GroupFooter } from '@/shared/ui/GroupFooter'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Row } from '@/shared/ui/Row'

export const metadata: Metadata = { title: 'Daten & System · Preposaurus' }

const SOURCE_CODE_URL = 'https://github.com/polygonhunter/preposaurus'

// Daten & System (#37). Lizenz und Quellen (SYS-06) lesen alle Angemeldeten, denn die AGPL verlangt
// den Quelltext-Hinweis für jede Person, die die App nutzt (#217). Der Export (SYS-01) folgt und
// prüft dann die Admin-Rolle selbst.
export default async function SystemPage() {
  await requirePageHousehold()
  return (
    <>
      <PageHeader title="Daten & System" back={{ href: SETTINGS_PATH, label: 'Einstellungen' }} />
      <GroupHeader id="lizenz">Lizenz und Quellen</GroupHeader>
      <Group labelledBy="lizenz">
        <Row title="Lizenz" trailing="AGPL-3.0-or-later" />
        <Row
          title="Quelltext"
          trailing={
            <a href={SOURCE_CODE_URL} target="_blank" rel="noreferrer" className="text-accent">
              GitHub
            </a>
          }
        />
        <Row title="Empfehlung für den Vorrat" action={{ href: GOAL_PATH }} />
      </Group>
      <GroupFooter>
        Preposaurus ist freie Software. Ihr dürft sie nutzen, ändern und weitergeben.
      </GroupFooter>
    </>
  )
}
