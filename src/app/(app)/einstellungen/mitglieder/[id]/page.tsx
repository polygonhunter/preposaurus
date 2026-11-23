import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getHousehold, getMember } from '@/features/household/application/get-household'
import { householdServices } from '@/features/household/application/household-services'
import { memberIdSchema } from '@/features/household/schemas'
import { MemberForm } from '@/features/household/ui/MemberForm'
import { formValuesOf } from '@/features/household/ui/member-form-values'
import { DIET_LABELS } from '@/features/household/ui/member-labels'
import { RemoveMemberButton } from '@/features/household/ui/RemoveMemberButton'
import { requirePageHouseholdAdmin } from '@/server/auth/household'
import { MEMBERS_PATH } from '@/shared/config/settings-paths'
import { PageHeader } from '@/shared/ui/PageHeader'

export const metadata: Metadata = { title: 'Person bearbeiten · Preposaurus' }

// Person bearbeiten oder entfernen (#38), nur für den Admin. Eine fremde oder unbekannte ID findet
// nichts, weil das Repository auf den Haushalt filtert.
export default async function MemberPage({ params }: PageProps<'/einstellungen/mitglieder/[id]'>) {
  const { householdId } = await requirePageHouseholdAdmin()
  const parsed = memberIdSchema.safeParse((await params).id)
  if (!parsed.success) notFound()
  const services = await householdServices()
  const [member, { rules }] = await Promise.all([
    getMember(services, { householdId, memberId: parsed.data }),
    getHousehold(services, householdId),
  ])
  if (member === null) notFound()
  return (
    <>
      <PageHeader title={member.name} back={{ href: MEMBERS_PATH, label: 'Mitglieder' }} />
      <MemberForm
        memberId={member.id}
        initialValues={formValuesOf(member)}
        householdDietLabel={DIET_LABELS[rules.defaultDiet]}
      />
      <RemoveMemberButton memberId={member.id} name={member.name} />
    </>
  )
}
