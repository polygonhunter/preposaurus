import type { Metadata } from 'next'
import {
  listHouseholdUsers,
  userAdminRepository,
} from '@/features/auth/application/list-household-users'
import { CreateUserForm } from '@/features/auth/ui/CreateUserForm'
import { getHousehold } from '@/features/household/application/get-household'
import { householdServices } from '@/features/household/application/household-services'
import { requirePageHouseholdAdmin } from '@/server/auth/household'
import { USERS_PATH } from '@/shared/config/settings-paths'
import { PageHeader } from '@/shared/ui/PageHeader'

export const metadata: Metadata = { title: 'Nutzer anlegen · Preposaurus' }

// Nutzer anlegen (#123), nur für den Admin. Zur Wahl stehen Personen ohne eigenen Login.
export default async function NewUserPage() {
  const { householdId } = await requirePageHouseholdAdmin()
  const [{ members }, users] = await Promise.all([
    getHousehold(await householdServices(), householdId),
    listHouseholdUsers(await userAdminRepository(), householdId),
  ])
  const linked = new Set(users.map((user) => user.memberId))
  const free = members.filter((member) => !linked.has(member.id))
  return (
    <>
      <PageHeader title="Nutzer anlegen" back={{ href: USERS_PATH, label: 'Nutzer' }} />
      <CreateUserForm members={free.map(({ id, name }) => ({ id, name }))} />
    </>
  )
}
