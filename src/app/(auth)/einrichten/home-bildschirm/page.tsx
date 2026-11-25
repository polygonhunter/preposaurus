import type { Metadata } from 'next'
import { requireSetupStepPage } from '@/features/auth/application/setup-step-request'
import { ContinueSetupButton } from '@/features/auth/ui/ContinueSetupButton'
import { stepText } from '@/features/auth/ui/setup-step-text'
import { SkipWhenInstalled } from '@/features/auth/ui/SkipWhenInstalled'
import { SETUP_RECOGNITION_PATH } from '@/shared/config/setup-paths'
import { INSTALL_HINT_TEXT, INSTALL_HINT_TITLE } from '@/shared/lib/install-hint'
import { Group } from '@/shared/ui/Group'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Row } from '@/shared/ui/Row'

export const metadata: Metadata = { title: 'Zum Home-Bildschirm · Preposaurus' }

const STEPS = [
  'In Safari auf „Teilen“ tippen',
  '„Zum Home-Bildschirm“ wählen',
  'Oben rechts auf „Hinzufügen“ tippen',
] as const

// Einrichtung, Schritt „Zum Home-Bildschirm“ (#40, ONBOARDING §2.2): nur im iPhone-Safari (Regel
// wie beim Hinweis auf der Übersicht), in der schon installierten App überspringt er sich selbst.
// Beide Knöpfe schließen die Einrichtung ab.
export default async function SetupHomeScreenPage() {
  const { position } = await requireSetupStepPage('home-bildschirm')
  return (
    <>
      <PageHeader
        back={{ href: SETUP_RECOGNITION_PATH, label: 'Zurück' }}
        eyebrow={stepText(position)}
        title={INSTALL_HINT_TITLE}
        subtitle={INSTALL_HINT_TEXT}
      />
      <GroupHeader id="so-gehts">So geht’s</GroupHeader>
      <Group labelledBy="so-gehts">
        {STEPS.map((text, index) => (
          <Row key={text} title={`${String(index + 1)}. ${text}`} />
        ))}
      </Group>
      <div className="mx-4 flex flex-col gap-3 pt-6 breit:mx-6">
        <ContinueSetupButton step="home-bildschirm" label="Erledigt" />
        <ContinueSetupButton step="home-bildschirm" label="Später" variant="plain" />
      </div>
      <SkipWhenInstalled />
    </>
  )
}
