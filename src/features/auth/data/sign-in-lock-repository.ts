// Zählerstände der Anmeldebremse in anmelde_sperre (EINSTELLUNGEN_NUTZER §4.3). Sie liegen in der
// DB, damit ein Neustart sie nicht löscht. Jeder Versuch wird atomar gezählt, bevor das Passwort
// geprüft wird: INSERT … ON CONFLICT DO UPDATE … RETURNING in einer Transaktion. Die Zeilensperre
// hält parallele Anfragen an, bis die neue Sperre feststeht.
import 'server-only'
import { eq, inArray, sql } from 'drizzle-orm'
import type { Database } from '@/server/db/connection'
import { signInLocks } from '@/server/db/schema/sign-in-lock'
import type { BrakeRule } from '../domain/sign-in-brake'

export interface BrakeRequest {
  readonly key: string
  readonly rule: BrakeRule
}

/** null = reserviert, sonst das Ende der Sperre, die den Versuch verhindert */
type Reservation = Date | null

export interface SignInLockRepository {
  reserve: (requests: readonly BrakeRequest[], now: Date) => Promise<Reservation>
  /** Nach einem Erfolg: Schlüssel löschen bzw. die Reservierung zurücknehmen */
  release: (keysToDelete: readonly string[], keysToDecrement: readonly string[]) => Promise<void>
}

class Blocked extends Error {
  readonly lockedUntil: Date

  constructor(lockedUntil: Date) {
    super('Anmeldung gebremst')
    this.lockedUntil = lockedUntil
  }
}

const at = (date: Date) => sql`${date.toISOString()}::timestamptz`

function nextCount(rule: BrakeRule, now: Date) {
  if (rule.windowMs === null) return sql`${signInLocks.failedAttempts} + 1`
  const windowStart = new Date(now.getTime() - rule.windowMs)
  return sql`case when ${signInLocks.lastFailedAt} < ${at(windowStart)} then 1 else ${signInLocks.failedAttempts} + 1 end`
}

async function currentLock(db: Database, key: string, now: Date): Promise<Date> {
  const [row] = await db
    .select({ lockedUntil: signInLocks.lockedUntil })
    .from(signInLocks)
    .where(eq(signInLocks.key, key))
  return row?.lockedUntil ?? now
}

async function reserveOne(db: Database, { key, rule }: BrakeRequest, now: Date): Promise<void> {
  const [row] = await db
    .insert(signInLocks)
    .values({ key, failedAttempts: 1, lastFailedAt: now })
    .onConflictDoUpdate({
      target: signInLocks.key,
      set: { failedAttempts: nextCount(rule, now), lastFailedAt: now, updatedAt: now },
      // Während einer laufenden Sperre zählt nichts weiter.
      setWhere: sql`${signInLocks.lockedUntil} is null or ${signInLocks.lockedUntil} <= ${at(now)}`,
    })
    .returning({ failedAttempts: signInLocks.failedAttempts })
  if (row === undefined) throw new Blocked(await currentLock(db, key, now))
  const lockMs = rule.lockMsAfter(row.failedAttempts)
  if (lockMs > 0) {
    const lockedUntil = new Date(now.getTime() + lockMs)
    await db.update(signInLocks).set({ lockedUntil }).where(eq(signInLocks.key, key))
  }
}

// Gemeinsame Reihenfolge der Schlüssel, damit sich parallele Transaktionen nicht verklemmen.
const byKey = (a: BrakeRequest, b: BrakeRequest) => a.key.localeCompare(b.key)

export function createSignInLockRepository(db: Database): SignInLockRepository {
  return {
    async reserve(requests, now) {
      try {
        await db.transaction(async (tx) => {
          for (const request of [...requests].sort(byKey)) await reserveOne(tx, request, now)
        })
        return null
      } catch (error) {
        // Gebremst: Die Transaktion ist zurückgerollt, kein Schlüssel wurde gezählt.
        if (error instanceof Blocked) return error.lockedUntil
        throw error
      }
    },
    async release(keysToDelete, keysToDecrement) {
      if (keysToDelete.length > 0) {
        await db.delete(signInLocks).where(inArray(signInLocks.key, [...keysToDelete]))
      }
      if (keysToDecrement.length === 0) return
      await db
        .update(signInLocks)
        .set({ failedAttempts: sql`greatest(${signInLocks.failedAttempts} - 1, 0)` })
        .where(inArray(signInLocks.key, [...keysToDecrement]))
    },
  }
}
