import { formatGermanDateTime } from '@/shared/lib/date-time'
import { Group } from '@/shared/ui/Group'
import { GroupFooter } from '@/shared/ui/GroupFooter'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { Row } from '@/shared/ui/Row'
import type { BackupKind, BackupStatus } from '../domain/backup-status'

type BackupGroupProps = Readonly<{ status: BackupStatus }>

const KIND_LABELS: Record<BackupKind, string> = {
  taeglich: 'tägliche Sicherung',
  woechentlich: 'wöchentliche Sicherung',
  manuell: 'von Hand gesichert',
  'vor-update': 'vor einem Update',
  'vor-wiederherstellung': 'vor einer Wiederherstellung',
}

// Ruhig und mit nächstem Schritt, ohne Angstmache (CLAUDE.md, #147).
const FOOTERS: Record<BackupStatus['state'], string> = {
  ok: 'Der Dienst „backup“ sichert jede Nacht Datenbank und Fotos.',
  stale:
    'Die letzte Sicherung ist schon etwas her. Schau bei Gelegenheit, ob der Dienst „backup“ läuft (docker compose ps).',
  failed:
    'Die letzte Sicherung hat nicht geklappt. Was fehlte, steht in den Meldungen vom Dienst „backup“ (docker compose logs backup).',
  unknown:
    'Hier steht noch keine Sicherung. Läuft der Dienst „backup“, erscheint der Zeitpunkt nach der ersten Sicherung.',
}

// Letzte Sicherung unter „Daten & System“, nur für Admins (#147).
export function BackupGroup({ status }: BackupGroupProps) {
  const lastBackup = status.state === 'unknown' ? null : status.lastBackup
  return (
    <>
      <GroupHeader id="sicherung">Sicherung</GroupHeader>
      <Group labelledBy="sicherung">
        <Row
          title="Letzte Sicherung"
          subtitle={lastBackup === null ? undefined : KIND_LABELS[lastBackup.kind]}
          trailing={lastBackup === null ? 'keine' : formatGermanDateTime(lastBackup.at)}
        />
      </Group>
      <GroupFooter>{FOOTERS[status.state]}</GroupFooter>
    </>
  )
}
