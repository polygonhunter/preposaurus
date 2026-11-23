import type { Metadata } from 'next'
import { goalServices } from '@/features/supply/application/goal-services'
import { getGoalSettings } from '@/features/supply/application/goal-settings'
import { GoalForm } from '@/features/supply/ui/GoalForm'
import { goalFormValuesOf } from '@/features/supply/ui/goal-format'
import { GoalSource } from '@/features/supply/ui/GoalSource'
import { GoalSummary } from '@/features/supply/ui/GoalSummary'
import { requirePageHousehold } from '@/server/auth/household'
import { SETTINGS_PATH } from '@/shared/config/settings-paths'
import { GroupFooter } from '@/shared/ui/GroupFooter'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { PageHeader } from '@/shared/ui/PageHeader'

export const metadata: Metadata = { title: 'Ziel und Empfehlung · Preposaurus' }

const PAST_DATE_NOTE =
  'Euer Zieldatum ist schon vorbei. Magst du ein neues wählen? Bis dahin zeigt die Übersicht, wie lange ihr heute versorgt seid.'

// Ziel und Empfehlung (#39, ZIEL-01, ZIEL-03, ZIEL-04). Der Admin ändert Dauer und Datum, Mitglieder
// lesen. Quelle und Rechenmodus stehen fest.
export default async function GoalPage() {
  const { householdId, isAdmin } = await requirePageHousehold()
  const goal = await getGoalSettings(await goalServices(), householdId)
  return (
    <>
      <PageHeader
        title="Ziel und Empfehlung"
        back={{ href: SETTINGS_PATH, label: 'Einstellungen' }}
      />
      <GroupHeader id="ziel">Euer Ziel</GroupHeader>
      {goal.isTargetDatePast ? (
        <p role="status" className="mx-4 pb-3 text-callout breit:mx-6">
          {PAST_DATE_NOTE}
        </p>
      ) : null}
      {isAdmin ? (
        <GoalForm
          initialValues={goalFormValuesOf(goal)}
          defaultDays={goal.defaultDays}
          place="einstellungen"
        />
      ) : (
        <>
          <GoalSummary goal={goal} labelledBy="ziel" />
          <GroupFooter>Das ändert ein Admin.</GroupFooter>
        </>
      )}
      <GroupHeader id="empfehlung">Empfehlung</GroupHeader>
      <GoalSource source={goal.source} labelledBy="empfehlung" />
      <GroupFooter>
        Die Empfehlung legt fest, wie viel Essen und Wasser je Person und Tag zählt.
      </GroupFooter>
    </>
  )
}
