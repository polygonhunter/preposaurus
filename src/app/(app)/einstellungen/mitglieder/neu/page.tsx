import type { Metadata } from 'next'
import { getHousehold } from '@/features/household/application/get-household'
import { householdServices } from '@/features/household/application/household-services'
import { MemberForm } from '@/features/household/ui/MemberForm'
import { NEW_MEMBER_VALUES } from '@/features/household/ui/member-form-values'
import { DIET_LABELS } from '@/features/household/ui/member-labels'
import { requirePageHouseholdAdmin } from '@/server/auth/household'
import { MEMBERS_PATH } from '@/shared/config/settings-paths'
import { PageHeader } from '@/shared/ui/PageHeader'

export const metadata: Metadata = { title: 'Person hinzufügen · Preposaurus' }

// Neue Person (#38), nur für den Admin. Mitglieder bekommen „nicht gefunden“.
export default async function NewMemberPage() {
  const { householdId } = await requirePageHouseholdAdmin()
  const { rules } = await getHousehold(await householdServices(), householdId)
  return (
    <>
      <PageHeader title="Person hinzufügen" back={{ href: MEMBERS_PATH, label: 'Mitglieder' }} />
      <MemberForm
        memberId={null}
        initialValues={NEW_MEMBER_VALUES}
        householdDietLabel={DIET_LABELS[rules.defaultDiet]}
      />
    </>
  )
}
