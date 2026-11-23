import { Group } from '@/shared/ui/Group'
import { Row } from '@/shared/ui/Row'
import { UNVERIFIED_SOURCE_NOTE } from '@/shared/config/recommendation-source'

type SourceView = Readonly<{ name: string; asOf: string; link: string; isVerified: boolean }>

type GoalSourceProps = Readonly<{ source: SourceView | null; labelledBy: string }>

// Ohne Quelle fehlt der Seed. Ein Admin spielt ihn mit den Stammdaten ein (Dienst „migrate“).
const NO_SOURCE_TEXT =
  'Die offiziellen Werte (BBK/BLE) sind noch nicht eingetragen. Sie kommen mit den Stammdaten, die ein Admin beim Einrichten des Servers einspielt. Bis dahin zählt die Zieldauer.'

// Quelle der Empfehlung mit Name, Stand und Link (ZIEL-01). Im MVP gibt es eine Quelle und den
// Rechenmodus „Offiziell“, beides ist nicht wählbar. Ungeprüfte Werte tragen einen dezenten Hinweis.
export function GoalSource({ source, labelledBy }: GoalSourceProps) {
  return (
    <Group labelledBy={labelledBy}>
      {source === null ? (
        <Row title="Empfehlung" subtitle={NO_SOURCE_TEXT} />
      ) : (
        <>
          <Row
            title="Empfehlung"
            {...(source.isVerified ? {} : { subtitle: UNVERIFIED_SOURCE_NOTE })}
            trailing={source.name}
          />
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
