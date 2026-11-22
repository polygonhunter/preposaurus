import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { signOut } from '../../../src/features/auth/application/sign-out'
import type { Auth } from '../../../src/server/auth/auth'
import { readSession } from '../../../src/server/auth/session'
import { sessions, users } from '../../../src/server/db/schema/account'
import { insertBasics } from '../../helpers/db-fixtures'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { createCredentialUser, createTestAuth, signInForCookie } from './auth-fixtures'

const PASSWORD = 'Linse-Regal-Hafer-Wolke'
const credentials = { username: 'sam', password: PASSWORD }

describe('Sitzung lesen und abmelden', () => {
  let testDb: TestDb
  let auth: Auth
  let userId: string
  let householdId: string

  beforeAll(async () => {
    testDb = await createTestDb()
    auth = createTestAuth(testDb.db)
    householdId = (await insertBasics(testDb.db)).householdId
    userId = await createCredentialUser(auth, { username: 'sam', password: PASSWORD, householdId })
  })

  beforeEach(async () => {
    await testDb.db.delete(sessions)
    await testDb.db
      .update(users)
      .set({ isActive: true, role: 'mitglied' })
      .where(eq(users.id, userId))
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('liest Nutzer, Rolle und Haushalt aus der Sitzung', async () => {
    const { requestHeaders } = await signInForCookie(auth, credentials)

    expect(await readSession(auth, requestHeaders)).toEqual({
      id: userId,
      name: 'Alex',
      username: 'sam',
      role: 'mitglied',
      householdId,
    })
  })

  it('liest die Rolle je Anfrage frisch aus der DB', async () => {
    const { requestHeaders } = await signInForCookie(auth, credentials)
    await testDb.db.update(users).set({ role: 'admin' }).where(eq(users.id, userId))

    expect((await readSession(auth, requestHeaders))?.role).toBe('admin')
  })

  it('sperrt einen deaktivierten Nutzer sofort aus, auch mit laufender Sitzung', async () => {
    const { requestHeaders } = await signInForCookie(auth, credentials)
    await testDb.db.update(users).set({ isActive: false }).where(eq(users.id, userId))

    expect(await readSession(auth, requestHeaders)).toBeNull()
  })

  it('liefert keine Sitzung, wenn sie abgelaufen ist', async () => {
    const { requestHeaders } = await signInForCookie(auth, credentials)
    await testDb.db.update(sessions).set({ expiresAt: new Date(Date.now() - 1000) })

    expect(await readSession(auth, requestHeaders)).toBeNull()
  })

  it('liefert ohne Cookie keine Sitzung', async () => {
    expect(await readSession(auth, new Headers())).toBeNull()
  })

  it('beendet beim Abmelden die Sitzung dieses Geräts', async () => {
    const { requestHeaders } = await signInForCookie(auth, credentials)
    const other = await signInForCookie(auth, credentials)

    await signOut(requestHeaders, auth)

    expect(await readSession(auth, requestHeaders)).toBeNull()
    expect(await readSession(auth, other.requestHeaders)).not.toBeNull()
  })

  it('tut beim Abmelden ohne Sitzung nichts', async () => {
    await expect(signOut(new Headers(), auth)).resolves.toBeUndefined()
  })
})
