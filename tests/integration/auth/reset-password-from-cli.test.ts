import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  resetPasswordFromCli,
  type ResetPasswordDeps,
} from '../../../src/features/auth/application/reset-password-from-cli'
import { createPasswordResetRepository } from '../../../src/features/auth/data/password-reset-repository'
import type { Auth } from '../../../src/server/auth/auth'
import { accounts, sessions, users } from '../../../src/server/db/schema/account'
import { signInLocks } from '../../../src/server/db/schema/sign-in-lock'
import { insertBasics } from '../../helpers/db-fixtures'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { createCredentialUser, createTestAuth, signInForCookie } from './auth-fixtures'

const OLD_PASSWORD = 'Linse-Regal-Hafer-Wolke'
const NEW_PASSWORD = 'abcd-efgh-jkmn-pqrs-tuvw'
const now = new Date('2026-11-22T10:00:00Z')
const lockedUntil = new Date('2026-11-22T10:15:00Z')

describe('Passwort per Kommandozeile zurücksetzen', () => {
  let testDb: TestDb
  let auth: Auth
  let userId: string
  let otherUserId: string

  const deps = async (): Promise<ResetPasswordDeps> => {
    const context = await auth.$context
    return {
      repository: createPasswordResetRepository(testDb.db),
      hashPassword: (password) => context.password.hash(password),
      generatePassword: () => NEW_PASSWORD,
      now: () => now,
    }
  }

  const lockKeys = async () =>
    (await testDb.db.select({ key: signInLocks.key }).from(signInLocks)).map((row) => row.key)

  beforeAll(async () => {
    testDb = await createTestDb()
    auth = createTestAuth(testDb.db)
    const { householdId } = await insertBasics(testDb.db)
    userId = await createCredentialUser(auth, {
      username: 'alex',
      password: OLD_PASSWORD,
      householdId,
    })
    otherUserId = await createCredentialUser(auth, {
      username: 'sam',
      password: OLD_PASSWORD,
      householdId,
    })
  })

  beforeEach(async () => {
    await testDb.db.delete(signInLocks)
    await testDb.db.insert(signInLocks).values(
      ['name:alex', 'name:sam', 'global', 'ip:100.64.0.7', 'ip:unbekannt'].map((key) => ({
        key,
        failedAttempts: 30,
        lockedUntil,
      })),
    )
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('setzt ein neues vorläufiges Passwort, beendet alle Sitzungen und hebt die Sperren auf', async () => {
    await signInForCookie(auth, { username: 'alex', password: OLD_PASSWORD })

    const result = await resetPasswordFromCli(await deps(), '  Alex ')

    expect(result).toEqual({
      ok: true,
      value: { username: 'alex', password: NEW_PASSWORD, isActive: true },
    })
    expect(await testDb.db.select().from(sessions).where(eq(sessions.userId, userId))).toEqual([])
    expect(await lockKeys()).toEqual(['name:sam'])
    const [user] = await testDb.db.select().from(users).where(eq(users.id, userId))
    expect(user).toMatchObject({
      isPasswordTemporary: true,
      passwordChangedAt: now,
      passwordChangedBy: null,
    })
  })

  it('lässt Sitzungen und Passwort anderer Nutzer unangetastet', async () => {
    await signInForCookie(auth, { username: 'sam', password: OLD_PASSWORD })

    await resetPasswordFromCli(await deps(), 'alex')

    const others = await testDb.db.select().from(sessions).where(eq(sessions.userId, otherUserId))
    expect(others).toHaveLength(1)
    await expect(
      signInForCookie(auth, { username: 'sam', password: OLD_PASSWORD }),
    ).resolves.toBeDefined()
    const [other] = await testDb.db.select().from(users).where(eq(users.id, otherUserId))
    expect(other?.isPasswordTemporary).toBe(false)
  })

  it('speichert nur den Hash, mit dem die Anmeldung danach klappt', async () => {
    await resetPasswordFromCli(await deps(), 'alex')

    const [account] = await testDb.db.select().from(accounts).where(eq(accounts.userId, userId))
    expect(account?.password).not.toContain(NEW_PASSWORD)
    await expect(
      signInForCookie(auth, { username: 'alex', password: NEW_PASSWORD }),
    ).resolves.toBeDefined()
    await expect(
      signInForCookie(auth, { username: 'alex', password: OLD_PASSWORD }),
    ).rejects.toThrow()
  })

  it('legt ein Passwort-Konto an, wenn der Nutzer noch keines hat', async () => {
    await testDb.db.delete(accounts).where(eq(accounts.userId, userId))

    await resetPasswordFromCli(await deps(), 'alex')

    const rows = await testDb.db.select().from(accounts).where(eq(accounts.userId, userId))
    expect(rows).toMatchObject([{ providerId: 'credential', accountId: userId }])
  })

  it('meldet einen deaktivierten Nutzer, setzt das Passwort aber trotzdem', async () => {
    await testDb.db.update(users).set({ isActive: false }).where(eq(users.id, userId))

    const result = await resetPasswordFromCli(await deps(), 'alex')

    expect(result).toMatchObject({ ok: true, value: { isActive: false } })
    await testDb.db.update(users).set({ isActive: true }).where(eq(users.id, userId))
  })

  it('ändert nichts bei einem unbekannten Namen', async () => {
    const result = await resetPasswordFromCli(await deps(), 'niemand')

    expect(result).toEqual({ ok: false, error: { kind: 'not-found' } })
    expect(await lockKeys()).toHaveLength(5)
  })

  it('lehnt einen Namen außerhalb des Musters ab, ohne die DB zu fragen', async () => {
    const result = await resetPasswordFromCli(await deps(), '../etc')

    expect(result).toEqual({ ok: false, error: { kind: 'invalid-username' } })
    expect(await lockKeys()).toHaveLength(5)
  })
})
