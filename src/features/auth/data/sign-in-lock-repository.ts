// Zählerstände der Anmeldebremse in anmelde_sperre. Sie liegen in der DB, damit ein Neustart
// sie nicht löscht (EINSTELLUNGEN_NUTZER §4.3).
import 'server-only'
import { eq, inArray } from 'drizzle-orm'
import type { Database } from '@/server/db/connection'
import { signInLocks } from '@/server/db/schema/sign-in-lock'
import type { LockState } from '../domain/sign-in-brake'

export type SignInLockRepository = Readonly<{
  findByKeys: (keys: readonly string[]) => Promise<ReadonlyMap<string, LockState>>
  save: (key: string, state: LockState) => Promise<void>
  remove: (key: string) => Promise<void>
}>

export function createSignInLockRepository(db: Database): SignInLockRepository {
  return {
    async findByKeys(keys) {
      if (keys.length === 0) return new Map()
      const rows = await db
        .select({
          key: signInLocks.key,
          failedAttempts: signInLocks.failedAttempts,
          lastFailedAt: signInLocks.lastFailedAt,
          lockedUntil: signInLocks.lockedUntil,
        })
        .from(signInLocks)
        .where(inArray(signInLocks.key, [...keys]))
      return new Map(rows.map(({ key, ...state }) => [key, state]))
    },
    async save(key, state) {
      await db
        .insert(signInLocks)
        .values({ key, ...state })
        .onConflictDoUpdate({ target: signInLocks.key, set: { ...state, updatedAt: new Date() } })
    },
    async remove(key) {
      await db.delete(signInLocks).where(eq(signInLocks.key, key))
    },
  }
}
