import { Group } from '@/shared/ui/Group'
import { GroupFooter } from '@/shared/ui/GroupFooter'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { Row } from '@/shared/ui/Row'

const EXPORT_URL = '/api/export'

// Export als JSON unter „Daten & System“, nur für Admins (#80). Ein einfacher Link mit download,
// die Route prüft die Rolle selbst.
export function ExportGroup() {
  return (
    <>
      <GroupHeader id="export">Export</GroupHeader>
      <Group labelledBy="export">
        <Row
          title="Haushalt als JSON"
          trailing={
            <a href={EXPORT_URL} download className="touch-target text-accent">
              Herunterladen
            </a>
          }
        />
      </Group>
      <GroupFooter>
        Vorrat, Produkte, Packungen, Mitglieder, Ziel und Quelle mit Version. Ohne Passwörter,
        Sitzungen und KI-Schlüssel, Fotos nur als Verweis.
      </GroupFooter>
    </>
  )
}
