import type { Metadata } from 'next'
import { getBackupStatus } from '@/features/system/application/get-backup-status'
import { BackupGroup } from '@/features/system/ui/BackupGroup'
import { ExportGroup } from '@/features/system/ui/ExportGroup'
import { requirePageHousehold } from '@/server/auth/household'
import { APP_LICENSE, APP_VERSION } from '@/shared/config/app-info'
import { GOAL_PATH, SETTINGS_PATH } from '@/shared/config/settings-paths'
import { Group } from '@/shared/ui/Group'
import { GroupFooter } from '@/shared/ui/GroupFooter'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Row } from '@/shared/ui/Row'

export const metadata: Metadata = { title: 'Daten & System · Preposaurus' }

const SOURCE_CODE_URL = 'https://github.com/polygonhunter/preposaurus'
const THIRD_PARTY_URL = `${SOURCE_CODE_URL}/blob/main/THIRD_PARTY_NOTICES.md`

// Daten & System (#37). Lizenz und Quellen (SYS-06) lesen alle Angemeldeten, denn die AGPL verlangt
// den Quelltext-Hinweis für jede Person, die die App nutzt (#217). Letzte Sicherung (#147) und
// Export (#80) sehen nur Admins; die Export-Route prüft die Rolle zusätzlich selbst.
export default async function SystemPage() {
  const { isAdmin } = await requirePageHousehold()
  return (
    <>
      <PageHeader title="Daten & System" back={{ href: SETTINGS_PATH, label: 'Einstellungen' }} />
      {isAdmin ? <BackupGroup status={await getBackupStatus()} /> : null}
      {isAdmin ? <ExportGroup /> : null}
      <GroupHeader id="lizenz">Lizenz und Quellen</GroupHeader>
      <Group labelledBy="lizenz">
        <Row title="Version" trailing={APP_VERSION} />
        <Row title="Lizenz" trailing={APP_LICENSE} />
        <Row
          title="Quelltext"
          trailing={
            <a href={SOURCE_CODE_URL} target="_blank" rel="noreferrer" className="text-accent">
              GitHub
            </a>
          }
        />
        <Row
          title="Lizenzen Dritter"
          trailing={
            <a href={THIRD_PARTY_URL} target="_blank" rel="noreferrer" className="text-accent">
              Liste
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
