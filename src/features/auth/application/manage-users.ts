// Rolle, Status, Verknüpfung und Sitzungen eines Nutzers (#41, EINSTELLUNGEN_NUTZER §3.1, §3.3).
// Jede Änderung liest alle Nutzer des Haushalts gesperrt, prüft die Regel aus domain/user-rules.ts
// und schreibt erst dann. So bleibt immer ein aktiver Admin, auch wenn zwei Admins sich gleichzeitig
// herabstufen. Deaktivieren beendet alle Sitzungen des Nutzers in derselben Transaktion.
import 'server-only'
import { err, ok, type Result } from '@/shared/lib/result'
import type { ManagedUser, UserAdminTransaction, UserRole } from '../data/user-admin-repository'
import { changeRole, linkMember, setUserActive, type AppUser } from '../domain/user-rules'
import type { UserAdminServices } from './user-admin-services'

export type ManageUserError =
  { kind: 'not-found' } | { kind: 'last-admin' } | { kind: 'self' } | { kind: 'member-not-found' }

type Target = Readonly<{ householdId: string; userId: string }>

type Deps = Pick<UserAdminServices, 'users'>

const toAppUser = (user: ManagedUser): AppUser => ({
  ...user,
  role: user.role === 'admin' ? 'admin' : 'member',
})

async function lockedUsers(tx: UserAdminTransaction) {
  return (await tx.lockUsers()).map(toAppUser)
}

export async function changeUserRole(
  deps: Deps,
  command: Target & Readonly<{ role: UserRole }>,
): Promise<Result<null, ManageUserError>> {
  return deps.users.inTransaction(command.householdId, async (tx) => {
    const role = command.role === 'admin' ? 'admin' : 'member'
    const rule = changeRole(await lockedUsers(tx), command.userId, role)
    if (!rule.ok) return rule
    await tx.update(command.userId, { role: command.role })
    return ok(null)
  })
}

export async function setUserActiveState(
  deps: Deps,
  command: Target & Readonly<{ actorId: string; isActive: boolean }>,
): Promise<Result<null, ManageUserError>> {
  const { userId, isActive } = command
  if (!isActive && command.actorId === userId) return err({ kind: 'self' })
  return deps.users.inTransaction(command.householdId, async (tx) => {
    const rule = setUserActive(await lockedUsers(tx), userId, isActive)
    if (!rule.ok) return rule
    await tx.update(userId, { isActive })
    if (!isActive) await tx.endSessions(userId)
    return ok(null)
  })
}

export async function linkUserToMember(
  deps: Deps,
  command: Target & Readonly<{ memberId: string | null }>,
): Promise<Result<null, ManageUserError>> {
  const { householdId, userId, memberId } = command
  if (memberId !== null && !(await deps.users.isMemberInHousehold(householdId, memberId))) {
    return err({ kind: 'member-not-found' })
  }
  return deps.users.inTransaction(householdId, async (tx) => {
    const before = await lockedUsers(tx)
    const rule = linkMember(before, userId, memberId)
    if (!rule.ok) return rule
    // Zuerst lösen, dann setzen: mitglied_id ist eindeutig.
    const changed = rule.value.filter((user, index) => user.memberId !== before[index]?.memberId)
    for (const user of changed.filter((entry) => entry.memberId === null)) {
      await tx.update(user.id, { memberId: null })
    }
    for (const user of changed.filter((entry) => entry.memberId !== null)) {
      await tx.update(user.id, { memberId: user.memberId })
    }
    return ok(null)
  })
}

/** „Überall abmelden“ für einen Nutzer, etwa bei einem verlorenen Gerät */
export async function endUserSessions(
  deps: Deps,
  command: Target,
): Promise<Result<null, ManageUserError>> {
  return deps.users.inTransaction(command.householdId, async (tx) => {
    const users = await tx.lockUsers()
    if (!users.some((user) => user.id === command.userId)) return err({ kind: 'not-found' })
    await tx.endSessions(command.userId)
    return ok(null)
  })
}
