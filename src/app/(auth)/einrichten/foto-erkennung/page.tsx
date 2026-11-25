import type { Metadata } from 'next'
import { aiSettingsServices } from '@/features/ai-settings/application/ai-settings-services'
import { getAiSettingsOverview } from '@/features/ai-settings/application/get-ai-settings-overview'
import { recognitionSetupView } from '@/features/ai-settings/domain/recognition-setup-view'
import { RecognitionFacts } from '@/features/ai-settings/ui/RecognitionFacts'
import { RecognitionSetupNote } from '@/features/ai-settings/ui/RecognitionSetupNote'
import { SetupRecognitionForm } from '@/features/ai-settings/ui/SetupRecognitionForm'
import { requireSetupStepPage } from '@/features/auth/application/setup-step-request'
import { ContinueSetupButton } from '@/features/auth/ui/ContinueSetupButton'
import { stepText } from '@/features/auth/ui/setup-step-text'
import { SETUP_GOAL_PATH } from '@/shared/config/setup-paths'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { PageHeader } from '@/shared/ui/PageHeader'

export const metadata: Metadata = { title: 'Foto-Erkennung einrichten · Preposaurus' }

// Einrichtung, Schritt „Foto-Erkennung einrichten“ (#314, ONBOARDING §2.2 Schritt 4): Schlüssel
// eintragen schaltet die Erkennung ein, mit derselben Verbindung wie in den Einstellungen.
// Überspringen ändert nichts. Kommt die Verbindung aus der Umgebung, nennt der Schritt sie nur.
export default async function SetupRecognitionPage() {
  const { householdId, position } = await requireSetupStepPage('foto-erkennung')
  const view = recognitionSetupView(
    await getAiSettingsOverview(await aiSettingsServices(), householdId),
  )
  return (
    <>
      <PageHeader
        back={{ href: SETUP_GOAL_PATH, label: 'Zurück' }}
        eyebrow={stepText(position)}
        title="Foto-Erkennung einrichten"
        subtitle="Preposaurus kann Verpackung, Nährwerte und Datum von Fotos ablesen. Das ist freiwillig, von Hand erfassen geht immer."
      />
      <RecognitionFacts />
      {view.kind === 'form' ? (
        <>
          <GroupHeader id="schluessel">Schlüssel</GroupHeader>
          <SetupRecognitionForm />
          <div className="mx-4 pt-3 breit:mx-6">
            <ContinueSetupButton
              step="foto-erkennung"
              label="Später in den Einstellungen"
              variant="plain"
            />
          </div>
        </>
      ) : (
        <>
          <RecognitionSetupNote view={view} />
          <div className="mx-4 pt-6 breit:mx-6">
            <ContinueSetupButton step="foto-erkennung" label="Weiter" />
          </div>
        </>
      )}
    </>
  )
}
