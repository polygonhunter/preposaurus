import { Group } from '@/shared/ui/Group'
import { GroupFooter } from '@/shared/ui/GroupFooter'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { Row } from '@/shared/ui/Row'
import type { RecognitionSetupView } from '../domain/recognition-setup-view'
import { ENV_CONNECTION_LABELS } from './ai-labels'

type RecognitionSetupNoteProps = Readonly<{
  view: Exclude<RecognitionSetupView, { kind: 'form' }>
}>

const SWITCH_HINT = 'An- und ausschalten lässt sie sich unter Einstellungen → Foto-Erkennung.'

const ENV_NOTES: Record<keyof typeof ENV_CONNECTION_LABELS, string> = {
  anthropic: 'Auf dem Server ist schon ein Schlüssel hinterlegt (ANTHROPIC_API_KEY).',
  fake: 'Der Server nutzt den Test-Anbieter ohne Netz (AI_PROVIDER=fake).',
}

// Schritt „Foto-Erkennung einrichten“ ohne Formular (#314): Die Verbindung kommt aus der Umgebung
// oder ist schon eingerichtet. Dann bleibt nur „Weiter“.
export function RecognitionSetupNote({ view }: RecognitionSetupNoteProps) {
  const isFromEnv = view.kind === 'env'
  return (
    <>
      <GroupHeader id="verbindung">Verbindung</GroupHeader>
      <Group labelledBy="verbindung">
        {isFromEnv ? (
          <Row title={ENV_CONNECTION_LABELS[view.provider]} trailing="hat Vorrang" />
        ) : (
          <Row title="Foto-Erkennung" trailing="eingerichtet" />
        )}
      </Group>
      <GroupFooter>
        {isFromEnv ? `${ENV_NOTES[view.provider]} ${SWITCH_HINT}` : SWITCH_HINT}
      </GroupFooter>
    </>
  )
}
