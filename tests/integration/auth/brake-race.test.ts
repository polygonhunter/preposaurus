// Sicherheits-Review zu #138 (B1): Parallele Anfragen dürfen nicht an der Bremse vorbeikommen.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { signIn, type SignInDeps } from '../../../src/features/auth/application/sign-in'
import { createSignInLockRepository } from '../../../src/features/auth/data/sign-in-lock-repository'
import type { Auth } from '../../../src/server/auth/auth'
import { signInLocks } from '../../../src/server/db/schema/sign-in-lock'
import { insertBasics } from '../../helpers/db-fixtures'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { createCredentialUser, createTestAuth } from './auth-fixtures'

const PARALLEL = 30

describe('Bremse unter parallelen Anfragen', () => {
  let testDb: TestDb
  let auth: Auth
  let passwordChecks = 0

  // Zählt, wie viele Versuche Better Auth und damit die Passwortprüfung erreichen.
  const countingAuth = (): Auth =>
    ({
      ...auth,
      api: {
        ...auth.api,
        signInUsername: (...args: Parameters<Auth['api']['signInUsername']>) => {
          passwordChecks += 1
          return auth.api.signInUsername(...args)
        },
      },
    }) as Auth

  const deps = (clientIp: string | null): SignInDeps => ({
    auth: countingAuth(),
    locks: createSignInLockRepository(testDb.db),
    headers: new Headers(),
    clientIp,
    now: () => new Date(),
    logWarning: () => undefined,
  })

  beforeAll(async () => {
    testDb = await createTestDb()
    auth = createTestAuth(testDb.db)
    const { householdId } = await insertBasics(testDb.db)
    await createCredentialUser(auth, { username: 'alex', password: 'richtig-richtig', householdId })
  })

  afterAll(async () => {
    await testDb.close()
  })

  it(`lässt von ${String(PARALLEL)} parallelen Fehlversuchen höchstens 5 das Passwort prüfen`, async () => {
    const results = await Promise.all(
      Array.from({ length: PARALLEL }, (_, index) =>
        signIn(deps(`100.64.1.${String(index)}`), {
          username: 'alex',
          password: 'falsch-falsch',
          rememberMe: true,
        }),
      ),
    )

    const kinds = results.map((result) => (result.ok ? 'ok' : result.error.kind))
    expect(passwordChecks).toBeLessThanOrEqual(5)
    expect(kinds.filter((kind) => kind === 'invalid-credentials')).toHaveLength(passwordChecks)
    expect(kinds.filter((kind) => kind === 'throttled')).toHaveLength(PARALLEL - passwordChecks)
    const [nameLock] = (await testDb.db.select().from(signInLocks)).filter(
      (lock) => lock.key === 'name:alex',
    )
    expect(nameLock?.failedAttempts).toBe(5)
    expect(nameLock?.lockedUntil).toBeInstanceOf(Date)
  })
})
