import type { Metadata } from 'next'
import { requireSetupStepPage } from '@/features/auth/application/setup-step-request'
import { ContinueSetupButton } from '@/features/auth/ui/ContinueSetupButton'
import { stepText } from '@/features/auth/ui/setup-step-text'
import { goalServices } from '@/features/supply/application/goal-services'
import { getGoalSettings } from '@/features/supply/application/goal-settings'
import { GoalForm } from '@/features/supply/ui/GoalForm'
import { goalFormValuesOf } from '@/features/supply/ui/goal-format'
import { GoalSource } from '@/features/supply/ui/GoalSource'
import { SETUP_MEMBERS_PATH } from '@/shared/config/setup-paths'
import { GroupFooter } from '@/shared/ui/GroupFooter'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { PageHeader } from '@/shared/ui/PageHeader'

export const metadata: Metadata = { title: 'Euer Ziel · Preposaurus' }

// Einrichtung, Schritt „Ziel“ (#40, ONBOARDING §2.2): dasselbe Formular und dieselbe Quelle wie
// unter Einstellungen → Ziel und Empfehlung, samt Hinweis „Werte noch nicht geprüft“. Überspringen
// behält den Standard der Quelle.
export default async function SetupGoalPage() {
  const { householdId, position } = await requireSetupStepPage('ziel')
  const goal = await getGoalSettings(await goalServices(), householdId)
  return (
    <>
      <PageHeader
        back={{ href: SETUP_MEMBERS_PATH, label: 'Zurück' }}
        eyebrow={stepText(position)}
        title="Euer Ziel"
        subtitle="Ein Datum braucht es nicht. Alles lässt sich später unter Einstellungen ändern."
      />
      <div className="pt-6">
        <GoalForm
          initialValues={goalFormValuesOf(goal)}
          defaultDays={goal.defaultDays}
          place="einrichtung"
        />
      </div>
      <div className="mx-4 pt-3 breit:mx-6">
        <ContinueSetupButton step="ziel" label="Überspringen" variant="plain" />
      </div>
      <GroupHeader id="empfehlung">Empfehlung</GroupHeader>
      <GoalSource source={goal.source} labelledBy="empfehlung" />
      <GroupFooter>
        Die Empfehlung legt fest, wie viel Essen und Wasser je Person und Tag zählt.
      </GroupFooter>
    </>
  )
}
