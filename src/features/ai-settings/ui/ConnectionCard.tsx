import { Group } from '@/shared/ui/Group'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { Row } from '@/shared/ui/Row'
import type { ConnectionOverview } from '../domain/ai-settings-overview'
import { formatTestTime, TEST_STATUS_LABELS } from './ai-labels'
import { RemoveConnectionButton } from './RemoveConnectionButton'
import { ReplaceKeyButton } from './ReplaceKeyButton'
import { TestConnectionButton } from './TestConnectionButton'

type ConnectionCardProps = Readonly<{ connection: ConnectionOverview }>

// Vom Schlüssel steht nur da, dass er gespeichert ist, und seine letzten vier Zeichen (#108).
const keyText = (hint: string | null) =>
  hint === null ? 'fehlt' : `gespeichert · endet auf ${hint}`

function lastTestText(lastTest: ConnectionOverview['lastTest']): string {
  if (lastTest === null) return 'noch nicht getestet'
  return `${TEST_STATUS_LABELS[lastTest.status]} · ${formatTestTime(lastTest.testedAt)}`
}

// Eine Verbindung aus der App (#108): Anbieter, Schlüssel-Hinweis, letzter Test und die Handlungen.
export function ConnectionCard({ connection }: ConnectionCardProps) {
  const headingId = `verbindung-${connection.id}`
  return (
    <section aria-labelledby={headingId}>
      <GroupHeader id={headingId}>{connection.name}</GroupHeader>
      <Group>
        <Row title="Anbieter" trailing="Anthropic" />
        <Row title="Schlüssel" trailing={keyText(connection.keyHint)} />
        <Row title="Test" trailing={lastTestText(connection.lastTest)} />
      </Group>
      <div className="mx-4 flex flex-wrap items-start gap-2 pt-3 breit:mx-6">
        <TestConnectionButton target={connection.id} />
        <ReplaceKeyButton connectionId={connection.id} name={connection.name} />
        <RemoveConnectionButton connectionId={connection.id} name={connection.name} />
      </div>
    </section>
  )
}
