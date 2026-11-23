import type { Metadata } from 'next'
import { getHousehold } from '@/features/household/application/get-household'
import { householdServices } from '@/features/household/application/household-services'
import { goalServices } from '@/features/supply/application/goal-services'
import { getGoalSettings } from '@/features/supply/application/goal-settings'
import { formatGoalDays } from '@/features/supply/ui/goal-format'
import { SignOutButton } from '@/features/auth/ui/SignOutButton'
import { ROLE_LABELS } from '@/features/auth/ui/user-format'
import { AdminSettingsGroups } from '@/features/settings/ui/AdminSettingsGroups'
import { requirePageHousehold } from '@/server/auth/household'
import { GOAL_PATH, MEMBERS_PATH, RULES_PATH } from '@/shared/config/settings-paths'
import { Group } from '@/shared/ui/Group'
import { GroupFooter } from '@/shared/ui/GroupFooter'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Row } from '@/shared/ui/Row'

export const metadata: Metadata = { title: 'Einstellungen · Preposaurus' }

const personCount = (count: number) => (count === 1 ? '1 Person' : `${String(count)} Personen`)

// Einstellungen (#37): Mein Konto · Haushalt · Nutzerverwaltung · Daten & System. Mitglieder sehen
// den Haushalt nur lesend, die beiden Admin-Gruppen gar nicht. Deren Seiten prüfen die Rolle selbst.
export default async function SettingsPage() {
  const { householdId, username, isAdmin } = await requirePageHousehold()
  const [household, goal] = await Promise.all([
    getHousehold(await householdServices(), householdId),
    getGoalSettings(await goalServices(), householdId),
  ])
  return (
    <>
      <PageHeader title="Einstellungen" back={{ href: '/uebersicht', label: 'Übersicht' }} />
      <GroupHeader id="konto">Mein Konto</GroupHeader>
      <Group labelledBy="konto">
        <Row title="Angemeldet als" trailing={username} />
        <Row title="Rolle" trailing={ROLE_LABELS[isAdmin ? 'admin' : 'mitglied']} />
      </Group>
      <div className="pt-4">
        <SignOutButton />
      </div>
      <GroupHeader id="haushalt">Haushalt</GroupHeader>
      <Group labelledBy="haushalt">
        <Row
          title="Mitglieder und Ernährung"
          trailing={personCount(household.members.length)}
          action={{ href: MEMBERS_PATH }}
        />
        <Row
          title="Ziel und Empfehlung"
          trailing={formatGoalDays(goal.days)}
          action={{ href: GOAL_PATH }}
        />
        <Row
          title="Vorrat und Regeln"
          trailing={household.rules.stillGoodCounts ? '„Noch gut“ zählt' : undefined}
          action={{ href: RULES_PATH }}
        />
      </Group>
      {isAdmin ? null : (
        <GroupFooter>Ansehen kannst du alles, ändern kann es ein Admin.</GroupFooter>
      )}
      {isAdmin ? <AdminSettingsGroups /> : null}
    </>
  )
}
