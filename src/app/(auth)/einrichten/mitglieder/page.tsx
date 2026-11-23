import type { Metadata } from 'next'
import { requireSetupStepPage } from '@/features/auth/application/setup-step-request'
import { ContinueSetupButton } from '@/features/auth/ui/ContinueSetupButton'
import { stepText } from '@/features/auth/ui/setup-step-text'
import { getHousehold } from '@/features/household/application/get-household'
import { householdServices } from '@/features/household/application/household-services'
import { MemberList } from '@/features/household/ui/MemberList'
import { SETUP_NEW_MEMBER_PATH } from '@/shared/config/setup-paths'
import { ButtonLink } from '@/shared/ui/ButtonLink'
import { GroupFooter } from '@/shared/ui/GroupFooter'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { PageHeader } from '@/shared/ui/PageHeader'

export const metadata: Metadata = { title: 'Für wen plant ihr? · Preposaurus' }

const NOBODY_YET = 'Noch ist niemand eingetragen. Ohne Personen gibt es keinen Bedarf.'

// Einrichtung, Schritt „Mitglieder“ (#40, ONBOARDING §2.2): dieselbe Liste und dasselbe Formular
// wie in den Einstellungen. Überspringen geht immer, eintragen lässt sich auch später.
export default async function SetupMembersPage() {
  const { householdId, position } = await requireSetupStepPage('mitglieder')
  const { members, rules } = await getHousehold(await householdServices(), householdId)
  const hasMembers = members.length > 0
  return (
    <>
      <PageHeader
        eyebrow={stepText(position)}
        title="Für wen plant ihr?"
        subtitle="Daraus rechnet Preposaurus, wie viel Essen und Wasser ihr braucht."
      />
      <GroupHeader id="personen">Personen</GroupHeader>
      {hasMembers ? (
        <MemberList
          members={members}
          householdDiet={rules.defaultDiet}
          labelledBy="personen"
          canEdit={false}
        />
      ) : (
        <p className="mx-4 rounded-group bg-surface px-4 py-3 text-callout text-fg2 breit:mx-6">
          {NOBODY_YET}
        </p>
      )}
      <GroupFooter>Namen und weitere Angaben ändert ihr später unter Einstellungen.</GroupFooter>
      <div className="mx-4 flex flex-col gap-3 pt-6 breit:mx-6">
        {hasMembers ? (
          <>
            <ContinueSetupButton step="mitglieder" label="Weiter" />
            <ButtonLink href={SETUP_NEW_MEMBER_PATH} variant="plain">
              Weitere Person hinzufügen
            </ButtonLink>
          </>
        ) : (
          <>
            <ButtonLink href={SETUP_NEW_MEMBER_PATH}>Person hinzufügen</ButtonLink>
            <ContinueSetupButton step="mitglieder" label="Überspringen" variant="plain" />
          </>
        )}
      </div>
    </>
  )
}
