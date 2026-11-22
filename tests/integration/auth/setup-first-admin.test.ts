import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  setupFirstAdmin,
  type SetupDeps,
} from '../../../src/features/auth/application/setup-first-admin'
import { signIn } from '../../../src/features/auth/application/sign-in'
import { createFirstAdminRepository } from '../../../src/features/auth/data/first-admin-repository'
import { createSignInLockRepository } from '../../../src/features/auth/data/sign-in-lock-repository'
import type { SetupInput } from '../../../src/features/auth/schemas'
import type { Auth } from '../../../src/server/auth/auth'
import { accounts, users } from '../../../src/server/db/schema/account'
import { householdSettings, households } from '../../../src/server/db/schema/household'
import { goals } from '../../../src/server/db/schema/recommendation'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { createTestAuth } from './auth-fixtures'

const PASSWORD = 'Hafer Linse Regal Wolke'
const input: SetupInput = {
  username: 'kim.test',
  password: PASSWORD,
  passwordRepeat: PASSWORD,
  householdName: 'Testhaushalt',
}

describe('Ersteinrichtung: erster Admin und Haushalt', () => {
  let testDb: TestDb
  let auth: Auth

  const deps = async (): Promise<SetupDeps> => {
    const context = await auth.$context
    return {
      repository: createFirstAdminRepository(testDb.db),
      hashPassword: (password) => context.password.hash(password),
    }
  }

  beforeAll(async () => {
    testDb = await createTestDb()
    auth = createTestAuth(testDb.db)
  })

  // Nutzer, Konten, Einstellungen und Ziel hängen per CASCADE am Haushalt.
  beforeEach(async () => {
    await testDb.db.delete(households)
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('legt Admin, Haushalt, Einstellungen und Ziel an, das Passwort nur als Hash', async () => {
    expect(await createFirstAdminRepository(testDb.db).hasAnyUser()).toBe(false)

    expect(await setupFirstAdmin(await deps(), input)).toEqual({ ok: true, value: null })

    const [household] = await testDb.db.select().from(households)
    const [user] = await testDb.db.select().from(users)
    const [account] = await testDb.db.select().from(accounts)
    expect(household?.name).toBe('Testhaushalt')
    expect(user).toMatchObject({
      username: 'kim.test',
      role: 'admin',
      isActive: true,
      householdId: household?.id,
    })
    expect(user?.email).toBe(`${String(user?.id)}@nutzer.invalid`)
    expect(account?.password).toMatch(/^[0-9a-f]+:[0-9a-f]+$/)
    expect(account?.password).not.toContain(PASSWORD)
    expect(await testDb.db.select().from(householdSettings)).toEqual([
      expect.objectContaining({ householdId: household?.id, setupStep: 1, setupCompletedAt: null }),
    ])
    expect(await testDb.db.select().from(goals)).toEqual([
      expect.objectContaining({ householdId: household?.id, days: 10, targetDate: null }),
    ])
  })

  it('der neue Admin kann sich mit Benutzername und Passwort anmelden', async () => {
    await setupFirstAdmin(await deps(), input)

    const result = await signIn(
      {
        auth,
        locks: createSignInLockRepository(testDb.db),
        headers: new Headers(),
        clientIp: '100.64.0.7',
        now: () => new Date(),
        logWarning: () => undefined,
      },
      { username: 'kim.test', password: PASSWORD, rememberMe: true },
    )

    expect(result.ok).toBe(true)
  })

  it('ein zweiter Aufruf scheitert und legt nichts an', async () => {
    await setupFirstAdmin(await deps(), input)

    const second = await setupFirstAdmin(await deps(), { ...input, username: 'sam.test' })

    expect(second).toEqual({ ok: false, error: { kind: 'already-set-up' } })
    expect(await testDb.db.select({ id: users.id }).from(users)).toHaveLength(1)
    expect(await testDb.db.select({ id: households.id }).from(households)).toHaveLength(1)
  })

  it('von zwei gleichzeitigen Aufrufen gewinnt genau einer', async () => {
    const repository = createFirstAdminRepository(testDb.db)
    const admin = (username: string) => ({
      username,
      passwordHash: 'hash',
      householdName: 'Testhaushalt',
      goalDays: 10,
    })

    const results = await Promise.all([
      repository.createFirstAdmin(admin('kim.test')),
      repository.createFirstAdmin(admin('sam.test')),
      repository.createFirstAdmin(admin('alex.test')),
    ])

    expect(results.filter(Boolean)).toHaveLength(1)
    expect(await testDb.db.select({ id: users.id }).from(users)).toHaveLength(1)
    expect(await testDb.db.select({ id: households.id }).from(households)).toHaveLength(1)
    expect(await testDb.db.select({ id: goals.id }).from(goals)).toHaveLength(1)
  })
})
