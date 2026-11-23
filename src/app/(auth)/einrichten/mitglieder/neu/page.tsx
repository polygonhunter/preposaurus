import type { Metadata } from 'next'
import { requireSetupStepPage } from '@/features/auth/application/setup-step-request'
import { getHousehold } from '@/features/household/application/get-household'
import { householdServices } from '@/features/household/application/household-services'
import { MemberForm } from '@/features/household/ui/MemberForm'
import { NEW_MEMBER_VALUES } from '@/features/household/ui/member-form-values'
import { DIET_LABELS } from '@/features/household/ui/member-labels'
import { SETUP_MEMBERS_PATH } from '@/shared/config/setup-paths'
import { PageHeader } from '@/shared/ui/PageHeader'

export const metadata: Metadata = { title: 'Person hinzufügen · Preposaurus' }

// Neue Person aus der Einrichtung (#40): dasselbe Formular wie unter Einstellungen → Mitglieder,
// nach dem Speichern geht es zurück zum Schritt.
export default async function SetupNewMemberPage() {
  const { householdId } = await requireSetupStepPage('mitglieder')
  const { rules } = await getHousehold(await householdServices(), householdId)
  return (
    <>
      <PageHeader title="Person hinzufügen" back={{ href: SETUP_MEMBERS_PATH, label: 'Zurück' }} />
      <MemberForm
        memberId={null}
        initialValues={NEW_MEMBER_VALUES}
        householdDietLabel={DIET_LABELS[rules.defaultDiet]}
        returnTo="einrichtung"
      />
    </>
  )
}
