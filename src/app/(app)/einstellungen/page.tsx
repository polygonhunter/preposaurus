import type { Metadata } from 'next'
import { catalogServices } from '@/features/catalog/application/catalog-services'
import { listStorageLocations } from '@/features/catalog/application/storage-locations'
import { getHousehold } from '@/features/household/application/get-household'
import { householdServices } from '@/features/household/application/household-services'
import { goalServices } from '@/features/supply/application/goal-services'
import { getGoalSettings } from '@/features/supply/application/goal-settings'
import { formatGoalDays } from '@/features/supply/ui/goal-format'
import { SignOutButton } from '@/features/auth/ui/SignOutButton'
import { ROLE_LABELS } from '@/features/auth/ui/user-format'
import { AdminSettingsGroups } from '@/features/settings/ui/AdminSettingsGroups'
import { SystemSettingsGroup } from '@/features/settings/ui/SystemSettingsGroup'
import { requirePageHousehold } from '@/server/auth/household'
import {
  ACCOUNT_PATH,
  GOAL_PATH,
  MEMBERS_PATH,
  RULES_PATH,
  STORAGE_LOCATIONS_PATH,
} from '@/shared/config/settings-paths'
import { Group } from '@/shared/ui/Group'
import { GroupFooter } from '@/shared/ui/GroupFooter'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Row } from '@/shared/ui/Row'

export const metadata: Metadata = { title: 'Einstellungen · Preposaurus' }

const personCount = (count: number) => (count === 1 ? '1 Person' : `${String(count)} Personen`)

const locationCount = (count: number) => (count === 1 ? '1 Ort' : `${String(count)} Orte`)

// Einstellungen (#37): Mein Konto · Haushalt · Nutzerverwaltung · Daten & System. Mitglieder sehen
// den Haushalt nur lesend und die Nutzerverwaltung gar nicht (die Seiten prüfen die Rolle selbst).
// Daten & System mit Lizenz und Quelltext sehen alle (AGPL, #217).
export default async function SettingsPage() {
  const { householdId, username, isAdmin } = await requirePageHousehold()
  const [household, goal, locations] = await Promise.all([
    getHousehold(await householdServices(), householdId),
    getGoalSettings(await goalServices(), householdId),
    listStorageLocations(await catalogServices(), householdId),
  ])
  const visibleLocations = locations.filter((location) => !location.isHidden)
  return (
    <>
      <PageHeader title="Einstellungen" back={{ href: '/uebersicht', label: 'Übersicht' }} />
      <GroupHeader id="konto">Mein Konto</GroupHeader>
      <Group labelledBy="konto">
        <Row title="Angemeldet als" trailing={username} />
        <Row title="Rolle" trailing={ROLE_LABELS[isAdmin ? 'admin' : 'mitglied']} />
        <Row title="Profil, Passwort und Mails" action={{ href: ACCOUNT_PATH }} />
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
          title="Lagerorte"
          trailing={locationCount(visibleLocations.length)}
          action={{ href: STORAGE_LOCATIONS_PATH }}
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
      <SystemSettingsGroup isAdmin={isAdmin} />
    </>
  )
}
