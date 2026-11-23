import type { Metadata } from 'next'
import {
  listHouseholdUsers,
  userAdminRepository,
} from '@/features/auth/application/list-household-users'
import { UserList } from '@/features/auth/ui/UserList'
import { requirePageHouseholdAdmin } from '@/server/auth/household'
import { SETTINGS_PATH } from '@/shared/config/settings-paths'
import { GroupFooter } from '@/shared/ui/GroupFooter'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { PageHeader } from '@/shared/ui/PageHeader'

export const metadata: Metadata = { title: 'Nutzer · Preposaurus' }

// Nutzerverwaltung (#37, #41), nur für den Admin. Mitglieder bekommen „nicht gefunden“, auch per
// Direktaufruf.
export default async function UsersPage() {
  const { householdId } = await requirePageHouseholdAdmin()
  const users = await listHouseholdUsers(await userAdminRepository(), householdId)
  return (
    <>
      <PageHeader title="Nutzer" back={{ href: SETTINGS_PATH, label: 'Einstellungen' }} />
      <GroupHeader id="nutzer">Wer sich anmelden kann</GroupHeader>
      <UserList users={users} labelledBy="nutzer" />
      <GroupFooter>
        Nutzer melden sich mit Benutzername und Passwort an. Personen ohne Login, etwa Kinder,
        stehen unter Mitglieder.
      </GroupFooter>
    </>
  )
}
