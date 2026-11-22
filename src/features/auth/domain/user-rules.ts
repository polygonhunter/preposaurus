import { err, ok, type Result } from '@/shared/lib/result'

// Regeln der Nutzerverwaltung. Grundregel: Es bleibt immer mindestens ein aktiver Admin.

export type Role = 'admin' | 'member'

/** Login-Nutzer. Mit einem Haushaltsmitglied höchstens optional verknüpft. */
export interface AppUser {
  id: string
  role: Role
  isActive: boolean
  memberId: string | null
}

type UserRuleError = { kind: 'not-found' } | { kind: 'last-admin' }

type UserResult<T> = Result<T[], UserRuleError>

const isActiveAdmin = (user: AppUser) => user.isActive && user.role === 'admin'

export function isLastActiveAdmin(users: readonly AppUser[], userId: string): boolean {
  const admins = users.filter(isActiveAdmin)
  return admins.length === 1 && admins[0]?.id === userId
}

function guardLastAdmin(
  users: readonly AppUser[],
  userId: string,
  wouldLoseAdmin: boolean,
): UserRuleError | null {
  if (!users.some((user) => user.id === userId)) return { kind: 'not-found' }
  return wouldLoseAdmin && isLastActiveAdmin(users, userId) ? { kind: 'last-admin' } : null
}

function patch<T extends AppUser>(users: readonly T[], userId: string, changes: Partial<AppUser>) {
  return users.map((user) => (user.id === userId ? { ...user, ...changes } : user))
}

/** Der letzte aktive Admin kann nicht herabgestuft werden. */
export function changeRole<T extends AppUser>(
  users: readonly T[],
  userId: string,
  role: Role,
): UserResult<T> {
  const error = guardLastAdmin(users, userId, role !== 'admin')
  return error ? err(error) : ok(patch(users, userId, { role }))
}

/** Der letzte aktive Admin kann nicht deaktiviert werden. */
export function setUserActive<T extends AppUser>(
  users: readonly T[],
  userId: string,
  isActive: boolean,
): UserResult<T> {
  const error = guardLastAdmin(users, userId, !isActive)
  return error ? err(error) : ok(patch(users, userId, { isActive }))
}

/** Der letzte aktive Admin kann nicht entfernt werden. */
export function removeUser<T extends AppUser>(users: readonly T[], userId: string): UserResult<T> {
  const error = guardLastAdmin(users, userId, true)
  return error ? err(error) : ok(users.filter((user) => user.id !== userId))
}

/** Ein Mitglied gehört höchstens zu einem Nutzer: Eine neue Verknüpfung löst die alte. */
export function linkMember<T extends AppUser>(
  users: readonly T[],
  userId: string,
  memberId: string | null,
): UserResult<T> {
  if (!users.some((user) => user.id === userId)) return err({ kind: 'not-found' })
  return ok(
    users.map((user) => {
      if (user.id === userId) return { ...user, memberId }
      if (memberId !== null && user.memberId === memberId) return { ...user, memberId: null }
      return user
    }),
  )
}
