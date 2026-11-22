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

/** Sperren, die dieser Versuch selbst gesetzt hat (Schlüssel → Ende) */
export type LocksSet = ReadonlyMap<string, Date>

/** Reserviert mit den dabei gesetzten Sperren, oder gebremst bis blockedUntil */
type Reservation = { blockedUntil: null; locksSet: LocksSet } | { blockedUntil: Date }

export interface SignInLockRepository {
  reserve: (requests: readonly BrakeRequest[], now: Date) => Promise<Reservation>
  /** Nach einem Erfolg: Namen löschen, die übrigen Zähler um diesen Versuch zurücknehmen */
  release: (
    keysToDelete: readonly string[],
    keysToDecrement: readonly string[],
    locksSet: LocksSet,
  ) => Promise<void>
}

class Blocked extends Error {
  readonly lockedUntil: Date

  constructor(lockedUntil: Date) {
    super('Anmeldung gebremst')
    this.lockedUntil = lockedUntil
  }
}

// Gemeinsame Reihenfolge der Schlüssel, damit sich parallele Transaktionen nicht verklemmen.
const byKey = (a: BrakeRequest, b: BrakeRequest) => a.key.localeCompare(b.key)

const at = (date: Date) => sql`${date.toISOString()}::timestamptz`

// Regeln mit Fenster (Adresse, global) fangen nach Fensterende oder nach einer abgelaufenen Sperre
// wieder bei 1 an. Sonst erneuerte schon ein einziger Versuch je Sperrdauer die Sperre, das wäre
// eine Dauersperre (Review #138, N1). Der Name zählt weiter, damit die Wartezeit sich verdoppelt.
function nextCount(rule: BrakeRule, now: Date) {
  if (rule.windowMs === null) return sql`${signInLocks.failedAttempts} + 1`
  const windowStart = new Date(now.getTime() - rule.windowMs)
  const lockExpired = sql`${signInLocks.lockedUntil} is not null and ${signInLocks.lockedUntil} <= ${at(now)}`
  const windowOver = sql`${signInLocks.lastFailedAt} < ${at(windowStart)}`
  return sql`case when ${lockExpired} or ${windowOver} then 1 else ${signInLocks.failedAttempts} + 1 end`
}

async function currentLock(db: Database, key: string, now: Date): Promise<Date> {
  const [row] = await db
    .select({ lockedUntil: signInLocks.lockedUntil })
    .from(signInLocks)
    .where(eq(signInLocks.key, key))
  return row?.lockedUntil ?? now
}

/** Liefert das Ende der Sperre, die dieser Versuch setzt, sonst null. */
async function reserveOne(db: Database, { key, rule }: BrakeRequest, now: Date) {
  const [row] = await db
    .insert(signInLocks)
    .values({ key, failedAttempts: 1, lastFailedAt: now })
    .onConflictDoUpdate({
      target: signInLocks.key,
      set: {
        failedAttempts: nextCount(rule, now),
        lastFailedAt: now,
        lockedUntil: null,
        updatedAt: now,
      },
      // Während einer laufenden Sperre zählt nichts weiter.
      setWhere: sql`${signInLocks.lockedUntil} is null or ${signInLocks.lockedUntil} <= ${at(now)}`,
    })
    .returning({ failedAttempts: signInLocks.failedAttempts })
  if (row === undefined) throw new Blocked(await currentLock(db, key, now))
  const lockMs = rule.lockMsAfter(row.failedAttempts)
  if (lockMs === 0) return null
  const lockedUntil = new Date(now.getTime() + lockMs)
  await db.update(signInLocks).set({ lockedUntil }).where(eq(signInLocks.key, key))
  return lockedUntil
}

async function reserveAll(db: Database, requests: readonly BrakeRequest[], now: Date) {
  const locksSet = new Map<string, Date>()
  await db.transaction(async (tx) => {
    for (const request of [...requests].sort(byKey)) {
      const lockedUntil = await reserveOne(tx, request, now)
      if (lockedUntil !== null) locksSet.set(request.key, lockedUntil)
    }
  })
  return locksSet
}

// Hat genau der erfolgreiche Versuch die Sperre gesetzt, fällt sie mit ihm weg. Wer sich richtig
// anmeldet, sperrt so weder sein Gerät noch alle anderen aus.
async function decrement(db: Database, key: string, ownLock: Date | undefined) {
  await db
    .update(signInLocks)
    .set({
      failedAttempts: sql`greatest(${signInLocks.failedAttempts} - 1, 0)`,
      ...(ownLock === undefined
        ? {}
        : { lockedUntil: sql`nullif(${signInLocks.lockedUntil}, ${at(ownLock)})` }),
    })
    .where(eq(signInLocks.key, key))
}

export function createSignInLockRepository(db: Database): SignInLockRepository {
  return {
    async reserve(requests, now) {
      try {
        return { blockedUntil: null, locksSet: await reserveAll(db, requests, now) }
      } catch (error) {
        // Gebremst: Die Transaktion ist zurückgerollt, kein Schlüssel wurde gezählt.
        if (error instanceof Blocked) return { blockedUntil: error.lockedUntil }
        throw error
      }
    },
    async release(keysToDelete, keysToDecrement, locksSet) {
      if (keysToDelete.length > 0) {
        await db.delete(signInLocks).where(inArray(signInLocks.key, [...keysToDelete]))
      }
      for (const key of keysToDecrement) await decrement(db, key, locksSet.get(key))
    },
  }
}
