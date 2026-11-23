import { Group } from '@/shared/ui/Group'
import { Row } from '@/shared/ui/Row'

type SourceView = Readonly<{ name: string; asOf: string; link: string }>

type GoalSourceProps = Readonly<{ source: SourceView | null; labelledBy: string }>

// Quelle der Empfehlung mit Name, Stand und Link (ZIEL-01). Im MVP gibt es eine Quelle und den
// Rechenmodus „Offiziell“, beides ist nicht wählbar.
export function GoalSource({ source, labelledBy }: GoalSourceProps) {
  return (
    <Group labelledBy={labelledBy}>
      {source === null ? (
        <Row
          title="Empfehlung"
          subtitle="Die offiziellen Werte (BBK/BLE) sind noch nicht eingetragen. Bis dahin zählt die Zieldauer."
        />
      ) : (
        <>
          <Row title="Empfehlung" trailing={source.name} />
          <Row title="Stand" trailing={source.asOf} />
          <Row
            title="Zur Quelle"
            trailing={
              <a href={source.link} target="_blank" rel="noreferrer" className="text-accent">
                Öffnen
              </a>
            }
          />
        </>
      )}
      <Row title="Rechenmodus" trailing="Offiziell" />
    </Group>
  )
}
