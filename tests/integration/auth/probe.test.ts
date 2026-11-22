// Probelauf zu den offenen Punkten aus EINSTELLUNGEN_NUTZER §4.5 („beim Bau prüfen“).
// Die Ergebnisse stehen auch in der PR zu #32.
import { APIError } from 'better-auth/api'
import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Auth } from '../../../src/server/auth/auth'
import { readSession } from '../../../src/server/auth/session'
import { sessions, users } from '../../../src/server/db/schema/account'
import { insertBasics } from '../../helpers/db-fixtures'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import {
  createCredentialUser,
  createTestAuth,
  resetPassword,
  signInForCookie,
} from './auth-fixtures'

const PASSWORD = 'Linse-Regal-Hafer-Wolke'
const DAY_MS = 24 * 60 * 60 * 1000

describe('Probelauf Better Auth', () => {
  let testDb: TestDb
  let auth: Auth
  let householdId: string

  beforeAll(async () => {
    testDb = await createTestDb()
    auth = createTestAuth(testDb.db)
    householdId = (await insertBasics(testDb.db)).householdId
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('disableSignUp sperrt auch den Server-Aufruf signUpEmail', async () => {
    const signUp = auth.api.signUpEmail({
      body: { name: 'Eve', email: 'eve@nutzer.invalid', password: PASSWORD, username: 'eve' },
    })

    await expect(signUp).rejects.toBeInstanceOf(APIError)
    expect(await testDb.db.select().from(users).where(eq(users.username, 'eve'))).toHaveLength(0)
  })

  it('„Angemeldet bleiben“ abgewählt: Sitzung 1 Tag, Cookie ohne Ablauf (endet mit dem Browser)', async () => {
    const userId = await createCredentialUser(auth, {
      username: 'kim',
      password: PASSWORD,
      householdId,
    })
    const remembered = await signInForCookie(auth, { username: 'kim', password: PASSWORD })
    const forgotten = await signInForCookie(auth, {
      username: 'kim',
      password: PASSWORD,
      rememberMe: false,
    })

    expect(remembered.setCookie).toContain(`Max-Age=${String(180 * 24 * 60 * 60)}`)
    expect(forgotten.setCookie).toMatch(
      /session_token=[^;]+; Path=\/; HttpOnly; Secure; SameSite=Lax/,
    )
    expect(forgotten.setCookie).not.toMatch(/session_token=[^,]*Max-Age/)
    const rows = await testDb.db.select().from(sessions).where(eq(sessions.userId, userId))
    const lifetimes = rows.map((row) => row.expiresAt.getTime() - row.createdAt.getTime())
    expect(lifetimes.map((ms) => Math.round(ms / DAY_MS)).sort((a, b) => a - b)).toEqual([1, 180])
  })

  it('setzt Hash und Sitzungen ohne Admin-Plugin über $context', async () => {
    const userId = await createCredentialUser(auth, {
      username: 'lou',
      password: PASSWORD,
      householdId,
    })
    const { requestHeaders } = await signInForCookie(auth, { username: 'lou', password: PASSWORD })

    await resetPassword(auth, userId, 'Neues-Passwort-Wolke')

    expect(await readSession(auth, requestHeaders)).toBeNull()
    await expect(
      signInForCookie(auth, { username: 'lou', password: PASSWORD }),
    ).rejects.toBeInstanceOf(APIError)
    const fresh = await signInForCookie(auth, { username: 'lou', password: 'Neues-Passwort-Wolke' })
    expect((await readSession(auth, fresh.requestHeaders))?.id).toBe(userId)
  })

  it('der Plugin-Validator nutzt das gemeinsame Muster statt seines eigenen', async () => {
    // Der Standard des Plugins erlaubt _alex und ..., unser Muster nicht.
    for (const username of ['_alex', '...']) {
      const create = createCredentialUser(auth, { username, password: PASSWORD, householdId })
      await expect(create).rejects.toMatchObject({ body: { code: 'INVALID_USERNAME' } })
    }
  })

  it('Rolle, Status und Haushalt sind über die API nicht setzbar (input: false)', async () => {
    const fields = (await auth.$context).options.user.additionalFields

    expect(fields.role.input).toBe(false)
    expect(fields.isActive.input).toBe(false)
    expect(fields.householdId.input).toBe(false)
  })
})
