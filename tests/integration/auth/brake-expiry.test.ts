// Nachprüfung #138 (N1): Nach einer abgelaufenen Sperre fangen Adresse und global wieder bei 1 an,
// sonst hielte ein Versuch je Minute alle Anmeldungen dauerhaft auf. Der Name verdoppelt weiter.
import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { signIn, type SignInDeps } from '../../../src/features/auth/application/sign-in'
import { createSignInLockRepository } from '../../../src/features/auth/data/sign-in-lock-repository'
import type { Auth } from '../../../src/server/auth/auth'
import { signInLocks } from '../../../src/server/db/schema/sign-in-lock'
import { insertBasics } from '../../helpers/db-fixtures'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { createCredentialUser, createTestAuth } from './auth-fixtures'

const MINUTE = 60_000
const PASSWORD = 'Linse-Regal-Hafer-Wolke'
const start = new Date('2026-11-22T10:00:00Z')
const at = (minutes: number) => new Date(start.getTime() + minutes * MINUTE)

describe('Bremse nach Ablauf einer Sperre', () => {
  let testDb: TestDb
  let auth: Auth

  const attempt = (options: { username: string; password: string; ip: string; now: Date }) => {
    const deps: SignInDeps = {
      auth,
      locks: createSignInLockRepository(testDb.db),
      headers: new Headers(),
      clientIp: options.ip,
      now: () => options.now,
      logWarning: () => undefined,
    }
    return signIn(deps, {
      username: options.username,
      password: options.password,
      rememberMe: true,
    })
  }

  const lock = async (key: string) =>
    (await testDb.db.select().from(signInLocks).where(eq(signInLocks.key, key)))[0]

  beforeAll(async () => {
    testDb = await createTestDb()
    auth = createTestAuth(testDb.db)
    const { householdId } = await insertBasics(testDb.db)
    await createCredentialUser(auth, { username: 'alex', password: PASSWORD, householdId })
  })

  beforeEach(async () => {
    await testDb.db.delete(signInLocks)
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('ein Versuch je Minute blockiert eine richtige Anmeldung nicht dauerhaft', async () => {
    // 100 Fehlversuche sind gelaufen, die globale Pause endet bei Minute 1.
    await testDb.db
      .insert(signInLocks)
      .values({ key: 'global', failedAttempts: 100, lastFailedAt: start, lockedUntil: at(1) })

    for (let minute = 1; minute <= 5; minute += 1) {
      const ip = `100.64.9.${String(minute)}`
      const attacker = await attempt({ username: 'eve', password: 'raten', ip, now: at(minute) })
      const alex = await attempt({
        username: 'alex',
        password: PASSWORD,
        ip: '100.64.0.7',
        now: at(minute),
      })

      expect(attacker).toEqual({ ok: false, error: { kind: 'invalid-credentials' } })
      expect(alex.ok, `Minute ${String(minute)}`).toBe(true)
    }
    expect(await lock('global')).toMatchObject({ lockedUntil: null })
  })

  it('beginnt bei der Adresse nach Ablauf der Sperre wieder bei 1', async () => {
    await testDb.db.insert(signInLocks).values({
      key: 'ip:100.64.9.9',
      failedAttempts: 20,
      lastFailedAt: start,
      lockedUntil: at(10),
    })

    await attempt({ username: 'eve', password: 'raten', ip: '100.64.9.9', now: at(10) })

    expect(await lock('ip:100.64.9.9')).toMatchObject({ failedAttempts: 1, lockedUntil: null })
  })

  it('verdoppelt beim Namen nach Ablauf der Sperre weiter', async () => {
    await testDb.db
      .insert(signInLocks)
      .values({ key: 'name:alex', failedAttempts: 5, lastFailedAt: start, lockedUntil: at(1) })

    await attempt({ username: 'alex', password: 'falsch-falsch', ip: '100.64.0.7', now: at(1) })

    expect(await lock('name:alex')).toMatchObject({ failedAttempts: 6, lockedUntil: at(3) })
  })

  it('nimmt eine Sperre zurück, die genau der erfolgreiche Versuch gesetzt hätte', async () => {
    await testDb.db.insert(signInLocks).values([
      { key: 'global', failedAttempts: 99, lastFailedAt: start },
      { key: 'ip:100.64.0.7', failedAttempts: 19, lastFailedAt: start },
    ])

    const result = await attempt({
      username: 'alex',
      password: PASSWORD,
      ip: '100.64.0.7',
      now: start,
    })

    expect(result.ok).toBe(true)
    expect(await lock('global')).toMatchObject({ failedAttempts: 99, lockedUntil: null })
    expect(await lock('ip:100.64.0.7')).toMatchObject({ failedAttempts: 19, lockedUntil: null })
  })

  it('lässt eine fremde, schon laufende Sperre beim Erfolg stehen', async () => {
    await testDb.db
      .insert(signInLocks)
      .values({ key: 'ip:100.64.0.7', failedAttempts: 3, lastFailedAt: start })

    await attempt({ username: 'alex', password: PASSWORD, ip: '100.64.0.7', now: start })

    expect(await lock('ip:100.64.0.7')).toMatchObject({ failedAttempts: 3, lockedUntil: null })
  })
})
