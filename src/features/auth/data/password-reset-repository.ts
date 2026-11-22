// Schreibt das Zurücksetzen eines Passworts per Kommandozeile (EINSTELLUNGEN_NUTZER §3.4) in einer
// Transaktion: neuer Hash, vorläufig markiert, alle Sitzungen beendet, Anmeldesperren aufgehoben.
// Der Hash kommt fertig vom Use-Case, hier gibt es nie ein Passwort im Klartext.
import 'server-only'
import { and, eq, inArray, like, or, sql } from 'drizzle-orm'
import type { Database } from '@/server/db/connection'
import { accounts, sessions, users } from '@/server/db/schema/account'
import { signInLocks } from '@/server/db/schema/sign-in-lock'
import { CREDENTIAL_PROVIDER } from './credential'

type FoundUser = Readonly<{ id: string; isActive: boolean }>

type PasswordReset = Readonly<{
  userId: string
  passwordHash: string
  now: Date
  /** Sperren, die genau so heißen (name:<benutzername>, global) */
  lockKeys: readonly string[]
  /** Sperren, die so beginnen (ip:) */
  lockKeyPrefix: string
}>

export interface PasswordResetRepository {
  findUserByUsername: (username: string) => Promise<FoundUser | null>
  resetPassword: (reset: PasswordReset) => Promise<void>
}

async function storeCredential(tx: Database, userId: string, passwordHash: string) {
  const updated = await tx
    .update(accounts)
    .set({ password: passwordHash })
    .where(and(eq(accounts.userId, userId), eq(accounts.providerId, CREDENTIAL_PROVIDER)))
    .returning({ id: accounts.id })
  if (updated.length > 0) return
  // Ein Nutzer ohne Passwort-Konto bekommt eines, wie es Better Auth anlegen würde.
  await tx.insert(accounts).values({
    accountId: userId,
    providerId: CREDENTIAL_PROVIDER,
    userId,
    password: passwordHash,
  })
}

async function clearLocks(tx: Database, keys: readonly string[], prefix: string) {
  await tx
    .delete(signInLocks)
    .where(or(inArray(signInLocks.key, [...keys]), like(signInLocks.key, `${prefix}%`)))
}

export function createPasswordResetRepository(db: Database): PasswordResetRepository {
  return {
    async findUserByUsername(username) {
      const [row] = await db
        .select({ id: users.id, isActive: users.isActive })
        .from(users)
        .where(eq(sql`lower(${users.username})`, username.toLowerCase()))
      return row ?? null
    },
    async resetPassword({ userId, passwordHash, now, lockKeys, lockKeyPrefix }) {
      await db.transaction(async (tx) => {
        await storeCredential(tx, userId, passwordHash)
        await tx
          .update(users)
          // Leer bei passwort_geaendert_von heißt: per Kommandozeile gesetzt.
          .set({ isPasswordTemporary: true, passwordChangedAt: now, passwordChangedBy: null })
          .where(eq(users.id, userId))
        await tx.delete(sessions).where(eq(sessions.userId, userId))
        await clearLocks(tx, lockKeys, lockKeyPrefix)
      })
    },
  }
}
