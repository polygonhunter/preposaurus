// Bremse je Adresse ohne verwertbaren Header und globale Obergrenze (Sicherheits-Review #138).
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { signIn, type SignInDeps } from '../../../src/features/auth/application/sign-in'
import { createSignInLockRepository } from '../../../src/features/auth/data/sign-in-lock-repository'
import type { Auth } from '../../../src/server/auth/auth'
import { readClientIp } from '../../../src/server/auth/client-ip'
import { signInLocks } from '../../../src/server/db/schema/sign-in-lock'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { createTestAuth } from './auth-fixtures'

const now = new Date('2026-11-22T10:00:00Z')
const HEADER = 'x-forwarded-for'

describe('Gemeinsame Zähler der Anmeldebremse', () => {
  let testDb: TestDb
  let auth: Auth

  const attempt = (username: string, headers: Headers) => {
    const deps: SignInDeps = {
      auth,
      locks: createSignInLockRepository(testDb.db),
      headers,
      clientIp: readClientIp(headers, HEADER),
      now: () => now,
      logWarning: () => undefined,
    }
    return signIn(deps, { username, password: 'falsch-falsch', rememberMe: true })
  }

  const keys = async () => (await testDb.db.select().from(signInLocks)).map((lock) => lock.key)

  beforeAll(async () => {
    testDb = await createTestDb()
    auth = createTestAuth(testDb.db)
  })

  beforeEach(async () => {
    await testDb.db.delete(signInLocks)
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('zählt Anfragen ohne Header gemeinsam unter ip:unbekannt', async () => {
    await attempt('alex', new Headers())

    expect((await keys()).sort()).toEqual(['global', 'ip:unbekannt', 'name:alex'])
  })

  it('zählt eine Liste mehrerer Adressen wie eine fehlende Adresse', async () => {
    await attempt('alex', new Headers({ [HEADER]: '1.2.3.4, 100.64.0.7' }))

    expect(await keys()).toContain('ip:unbekannt')
  })

  it('bremst alle Geräte ohne Adresse nach 20 Fehlversuchen gemeinsam', async () => {
    for (let index = 0; index < 20; index += 1)
      await attempt(`name_${String(index)}`, new Headers())

    const result = await attempt('jemand', new Headers({ [HEADER]: 'a, b' }))

    expect(result).toEqual({ ok: false, error: { kind: 'throttled', minutes: 10 } })
  })

  it('pausiert nach 100 Versuchen in 10 Minuten alle, auch mit wechselnder Adresse', async () => {
    await testDb.db
      .insert(signInLocks)
      .values({ key: 'global', failedAttempts: 99, lastFailedAt: now })

    const hundredth = await attempt('alex', new Headers({ [HEADER]: '100.64.0.1' }))
    const next = await attempt('kim', new Headers({ [HEADER]: '100.64.0.2' }))

    expect(hundredth).toEqual({ ok: false, error: { kind: 'invalid-credentials' } })
    expect(next).toEqual({ ok: false, error: { kind: 'throttled', minutes: 1 } })
    expect(await keys()).not.toContain('name:kim')
  })

  it('fängt die globale Zählung nach 10 Minuten Ruhe neu an', async () => {
    const old = new Date(now.getTime() - 10 * 60_000 - 1)
    await testDb.db
      .insert(signInLocks)
      .values({ key: 'global', failedAttempts: 99, lastFailedAt: old })

    await attempt('alex', new Headers({ [HEADER]: '100.64.0.1' }))

    const [global] = (await testDb.db.select().from(signInLocks)).filter((l) => l.key === 'global')
    expect(global).toMatchObject({ failedAttempts: 1, lockedUntil: null })
  })
})
