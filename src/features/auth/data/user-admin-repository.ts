// Nutzer eines Haushalts für die Nutzerverwaltung (EIN-10, #41). Jede Abfrage filtert auf
// haushalt_id. Hashes, E-Mail und Sitzungs-Token liest hier nichts.
import 'server-only'
import { asc, eq } from 'drizzle-orm'
import type { Database } from '@/server/db/connection'
import { users } from '@/server/db/schema/account'
import { members } from '@/server/db/schema/household'
import type { USER_ROLES } from '@/shared/config/constants'

type UserRole = (typeof USER_ROLES)[number]

export type HouseholdUser = Readonly<{
  id: string
  name: string
  username: string
  role: UserRole
  isActive: boolean
  lastSignInAt: Date | null
  memberId: string | null
  memberName: string | null
}>

export interface UserAdminRepository {
  list: (householdId: string) => Promise<HouseholdUser[]>
}

export function createUserAdminRepository(db: Database): UserAdminRepository {
  return {
    list: (householdId) =>
      db
        .select({
          id: users.id,
          name: users.name,
          username: users.username,
          role: users.role,
          isActive: users.isActive,
          lastSignInAt: users.lastSignInAt,
          memberId: users.memberId,
          memberName: members.name,
        })
        .from(users)
        .leftJoin(members, eq(members.id, users.memberId))
        .where(eq(users.householdId, householdId))
        .orderBy(asc(users.name), asc(users.username)),
  }
}
