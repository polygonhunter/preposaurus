import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { signIn, type SignInDeps } from '../../../src/features/auth/application/sign-in'
import { createSignInLockRepository } from '../../../src/features/auth/data/sign-in-lock-repository'
import type { Auth } from '../../../src/server/auth/auth'
import { accounts, sessions, users } from '../../../src/server/db/schema/account'
import { signInLocks } from '../../../src/server/db/schema/sign-in-lock'
import { insertBasics } from '../../helpers/db-fixtures'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { createCredentialUser, createTestAuth } from './auth-fixtures'

const PASSWORD = 'Linse-Regal-Hafer-Wolke'
const now = new Date('2026-11-22T10:00:00Z')

describe('Anmelden mit Bremse', () => {
  let testDb: TestDb
  let auth: Auth
  let householdId: string
  let userId: string
  const warnings: string[] = []
  const loggedNames: unknown[] = []

  const deps = (clientIp: string | null = '100.64.0.7'): SignInDeps => ({
    auth,
    locks: createSignInLockRepository(testDb.db),
    headers: new Headers(),
    clientIp,
    now: () => now,
    logWarning: (message, context) => {
      warnings.push(message)
      loggedNames.push(context['username'])
    },
  })

  const attempt = (password: string, username = 'alex', clientIp?: string | null) =>
    signIn(deps(clientIp), { username, password, rememberMe: true })

  beforeAll(async () => {
    testDb = await createTestDb()
    auth = createTestAuth(testDb.db)
    householdId = (await insertBasics(testDb.db)).householdId
    userId = await createCredentialUser(auth, { username: 'Alex', password: PASSWORD, householdId })
  })

  beforeEach(async () => {
    await testDb.db.delete(signInLocks)
    await testDb.db.delete(sessions)
    await testDb.db.update(users).set({ isActive: true }).where(eq(users.id, userId))
    warnings.length = 0
    loggedNames.length = 0
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('meldet mit richtigem Passwort an, legt eine Sitzung an und merkt die Anmeldung', async () => {
    const result = await attempt(PASSWORD)

    expect(result).toEqual({ ok: true, value: { userId } })
    const rows = await testDb.db.select().from(sessions).where(eq(sessions.userId, userId))
    expect(rows).toHaveLength(1)
    const [user] = await testDb.db.select().from(users).where(eq(users.id, userId))
    expect(user?.lastSignInAt).toBeInstanceOf(Date)
  })

  it('speichert den Benutzernamen klein und das Passwort nur als Hash', async () => {
    const [user] = await testDb.db.select().from(users).where(eq(users.id, userId))
    const [account] = await testDb.db.select().from(accounts).where(eq(accounts.userId, userId))

    expect(user).toMatchObject({ username: 'alex', email: `${userId}@nutzer.invalid` })
    expect(account?.password).toBeTypeOf('string')
    expect(account?.password).not.toContain(PASSWORD)
  })

  it('lehnt ein falsches Passwort ab und zählt Name, Adresse und global', async () => {
    const result = await attempt('falsch-falsch')

    expect(result).toEqual({ ok: false, error: { kind: 'invalid-credentials' } })
    const locks = await testDb.db.select().from(signInLocks)
    expect(locks.map((lock) => [lock.key, lock.failedAttempts]).sort()).toEqual([
      ['global', 1],
      ['ip:100.64.0.7', 1],
      ['name:alex', 1],
    ])
    expect(warnings).toEqual(['Anmeldung fehlgeschlagen'])
  })

  it('schreibt einen Namen außerhalb des Musters nicht ins Log', async () => {
    await attempt('falsch-falsch', 'mein geheimes passwort')
    await attempt('falsch-falsch', 'alex')

    expect(loggedNames).toEqual(['<ungültig>', 'alex'])
  })

  it('zählt auch unbekannte Namen und antwortet gleich', async () => {
    const result = await attempt(PASSWORD, 'niemand', null)

    expect(result).toEqual({ ok: false, error: { kind: 'invalid-credentials' } })
    const locks = await testDb.db.select().from(signInLocks)
    expect(locks).toContainEqual(
      expect.objectContaining({ key: 'name:niemand', failedAttempts: 1 }),
    )
  })

  it('bremst den Namen nach 5 Fehlversuchen, auch mit richtigem Passwort', async () => {
    for (let index = 0; index < 5; index += 1) await attempt('falsch-falsch', 'alex', null)

    const result = await attempt(PASSWORD, 'alex', null)

    expect(result).toEqual({ ok: false, error: { kind: 'throttled', minutes: 1 } })
    expect(await testDb.db.select().from(sessions)).toHaveLength(0)
  })

  it('bremst eine Adresse nach 20 Fehlversuchen über verschiedene Namen', async () => {
    for (let index = 0; index < 20; index += 1)
      await attempt('falsch-falsch', `name_${String(index)}`)

    const result = await attempt(PASSWORD)

    expect(result).toEqual({ ok: false, error: { kind: 'throttled', minutes: 10 } })
  })

  it('setzt nach einem Erfolg den Namen zurück und zählt nur den Fehlversuch weiter', async () => {
    await attempt('falsch-falsch')
    await attempt(PASSWORD)

    const locks = await testDb.db.select().from(signInLocks)
    expect(locks.map((lock) => [lock.key, lock.failedAttempts]).sort()).toEqual([
      ['global', 1],
      ['ip:100.64.0.7', 1],
    ])
  })

  it('lässt einen deaktivierten Nutzer nicht an und antwortet wie bei falschem Passwort', async () => {
    await testDb.db.update(users).set({ isActive: false }).where(eq(users.id, userId))

    const result = await attempt(PASSWORD)

    expect(result).toEqual({ ok: false, error: { kind: 'invalid-credentials' } })
    expect(await testDb.db.select().from(sessions)).toHaveLength(0)
  })
})
