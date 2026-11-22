// Lesen und Schreiben der Notfall-Befehle auf dem NAS (EINSTELLUNGEN_NUTZER §3.4): Nutzer auflisten,
// einen Nutzer zum aktiven Admin machen, alle Sitzungen beenden. Es gibt nur einen Haushalt pro
// Installation, deshalb filtern diese Abfragen nicht nach householdId. Hashes liest hier nichts.
import 'server-only'
import { asc, eq, sql } from 'drizzle-orm'
import type { Database } from '@/server/db/connection'
import { sessions, users } from '@/server/db/schema/account'
import type { USER_ROLES } from '@/shared/config/constants'

type UserRole = (typeof USER_ROLES)[number]

export type UserOverview = Readonly<{
  username: string
  name: string
  role: UserRole
  isActive: boolean
  lastSignInAt: Date | null
}>

/** Stand des Nutzers vor der Änderung, damit der Befehl sagen kann, was sich geändert hat. */
export type PromotedUser = Readonly<{ username: string; wasAdmin: boolean; wasActive: boolean }>

export interface EmergencyUserRepository {
  listUsers: () => Promise<UserOverview[]>
  makeActiveAdmin: (username: string) => Promise<PromotedUser | null>
  endAllSessions: () => Promise<number>
}

const sameUsername = (username: string) => eq(sql`lower(${users.username})`, username.toLowerCase())

// Sperrt die Zeile, damit zwei gleichzeitige Aufrufe denselben Vorher-Stand nicht doppelt melden.
async function promoteToActiveAdmin(db: Database, username: string): Promise<PromotedUser | null> {
  return db.transaction(async (tx) => {
    const [user] = await tx
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
        isActive: users.isActive,
      })
      .from(users)
      .where(sameUsername(username))
      .for('update')
    if (user === undefined) return null
    await tx.update(users).set({ role: 'admin', isActive: true }).where(eq(users.id, user.id))
    return { username: user.username, wasAdmin: user.role === 'admin', wasActive: user.isActive }
  })
}

export function createEmergencyUserRepository(db: Database): EmergencyUserRepository {
  return {
    async listUsers() {
      return db
        .select({
          username: users.username,
          name: users.name,
          role: users.role,
          isActive: users.isActive,
          lastSignInAt: users.lastSignInAt,
        })
        .from(users)
        .orderBy(asc(users.username))
    },
    makeActiveAdmin: (username) => promoteToActiveAdmin(db, username),
    async endAllSessions() {
      const ended = await db.delete(sessions).returning({ id: sessions.id })
      return ended.length
    },
  }
}
