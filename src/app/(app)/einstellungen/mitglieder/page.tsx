import type { Metadata } from 'next'
import { getHousehold } from '@/features/household/application/get-household'
import { householdServices } from '@/features/household/application/household-services'
import { HouseholdDietForm } from '@/features/household/ui/HouseholdDietForm'
import { DIET_LABELS } from '@/features/household/ui/member-labels'
import { MemberList } from '@/features/household/ui/MemberList'
import { requirePageHousehold } from '@/server/auth/household'
import { NEW_MEMBER_PATH, SETTINGS_PATH } from '@/shared/config/settings-paths'
import { ButtonLink } from '@/shared/ui/ButtonLink'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Group } from '@/shared/ui/Group'
import { GroupFooter } from '@/shared/ui/GroupFooter'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Row } from '@/shared/ui/Row'

export const metadata: Metadata = { title: 'Mitglieder · Preposaurus' }

// Mitglieder und Ernährungsform (#38, HH-01 bis HH-04). Der Admin legt an und bearbeitet, Mitglieder
// sehen dieselbe Liste nur lesend.
export default async function MembersPage() {
  const { householdId, isAdmin } = await requirePageHousehold()
  const { members, rules } = await getHousehold(await householdServices(), householdId)
  return (
    <>
      <PageHeader
        title="Mitglieder"
        back={{ href: SETTINGS_PATH, label: 'Einstellungen' }}
        action={
          isAdmin ? (
            <ButtonLink href={NEW_MEMBER_PATH} variant="plain">
              Hinzufügen
            </ButtonLink>
          ) : undefined
        }
      />
      <GroupHeader id="personen">Personen</GroupHeader>
      {members.length === 0 ? (
        <EmptyState text="Noch ist niemand eingetragen. Ohne Personen gibt es keinen Bedarf." />
      ) : (
        <MemberList
          members={members}
          householdDiet={rules.defaultDiet}
          labelledBy="personen"
          canEdit={isAdmin}
        />
      )}
      <GroupHeader id="ernaehrung">Ernährung des Haushalts</GroupHeader>
      {isAdmin ? (
        <HouseholdDietForm diet={rules.defaultDiet} />
      ) : (
        <Group labelledBy="ernaehrung">
          <Row title="Ernährungsform" trailing={DIET_LABELS[rules.defaultDiet]} />
        </Group>
      )}
      <GroupFooter>
        Gilt für jede Person mit „Wie Haushalt“. Vegetarisch und vegan verschieben die Mengen
        zwischen den Warengruppen, die Kalorien bleiben gleich.
        {isAdmin ? null : ' Das ändert ein Admin.'}
      </GroupFooter>
    </>
  )
}
