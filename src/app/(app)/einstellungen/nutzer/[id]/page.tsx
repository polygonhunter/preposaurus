import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  listHouseholdUsers,
  userAdminRepository,
} from '@/features/auth/application/list-household-users'
import { isLastActiveAdmin } from '@/features/auth/domain/user-rules'
import { userIdSchema } from '@/features/auth/schemas'
import { UserAdminSections } from '@/features/auth/ui/UserAdminSections'
import { UserFacts } from '@/features/auth/ui/UserFacts'
import { getHousehold } from '@/features/household/application/get-household'
import { householdServices } from '@/features/household/application/household-services'
import { requirePageHouseholdAdmin } from '@/server/auth/household'
import { USERS_PATH } from '@/shared/config/settings-paths'
import { PageHeader } from '@/shared/ui/PageHeader'

export const metadata: Metadata = { title: 'Nutzer · Preposaurus' }

// Ein Nutzer in der Nutzerverwaltung (#41, #123), nur für den Admin. Fremde oder unbekannte IDs
// finden nichts, weil alle Abfragen auf den Haushalt filtern.
export default async function UserPage({ params }: PageProps<'/einstellungen/nutzer/[id]'>) {
  const { householdId, userId: actorId } = await requirePageHouseholdAdmin()
  const parsed = userIdSchema.safeParse((await params).id)
  if (!parsed.success) notFound()
  const [users, { members }] = await Promise.all([
    listHouseholdUsers(await userAdminRepository(), householdId),
    getHousehold(await householdServices(), householdId),
  ])
  const user = users.find((entry) => entry.id === parsed.data)
  if (user === undefined) notFound()
  const linkedElsewhere = new Set(
    users.filter((entry) => entry.id !== user.id).map((entry) => entry.memberId),
  )
  const rules = users.map(
    (entry) => ({ ...entry, role: entry.role === 'admin' ? 'admin' : 'member' }) as const,
  )
  return (
    <>
      <PageHeader title={user.name} back={{ href: USERS_PATH, label: 'Nutzer' }} />
      <UserFacts user={user} />
      <UserAdminSections
        user={user}
        members={members
          .filter((member) => !linkedElsewhere.has(member.id))
          .map(({ id, name }) => ({ id, name }))}
        isSelf={user.id === actorId}
        isLastActiveAdmin={isLastActiveAdmin(rules, user.id)}
      />
    </>
  )
}
