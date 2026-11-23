import { Group } from '@/shared/ui/Group'
import { GroupFooter } from '@/shared/ui/GroupFooter'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { Row } from '@/shared/ui/Row'
import { ENV_CONNECTION_LABELS } from './ai-labels'
import { TestConnectionButton } from './TestConnectionButton'

type EnvConnectionCardProps = Readonly<{ provider: keyof typeof ENV_CONNECTION_LABELS }>

const FOOTERS: Record<EnvConnectionCardProps['provider'], string> = {
  anthropic:
    'ANTHROPIC_API_KEY ist auf dem Server gesetzt und gilt für jede Rolle. Ändern lässt er sich ' +
    'nur dort. Verbindungen aus der App greifen erst, wenn er leer ist.',
  fake:
    'AI_PROVIDER=fake: feste Testantworten ohne Netz, nur für Entwicklung und Tests. Im Betrieb ' +
    'steht dort anthropic.',
}

// Feste Verbindung aus der Umgebung (#108): Sie hat Vorrang, lässt sich hier nur testen.
export function EnvConnectionCard({ provider }: EnvConnectionCardProps) {
  return (
    <section aria-labelledby="verbindung-umgebung">
      <GroupHeader id="verbindung-umgebung">Aus der Umgebung</GroupHeader>
      <Group>
        <Row title={ENV_CONNECTION_LABELS[provider]} trailing="hat Vorrang" />
      </Group>
      <GroupFooter>{FOOTERS[provider]}</GroupFooter>
      <div className="mx-4 pt-3 breit:mx-6">
        <TestConnectionButton target="env" />
      </div>
    </section>
  )
}
