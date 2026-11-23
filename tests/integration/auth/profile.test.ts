import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { changeOwnPassword } from '../../../src/features/auth/application/change-own-password'
import {
  getOwnProfile,
  saveOwnCheckIn,
  updateOwnProfile,
} from '../../../src/features/auth/application/manage-profile'
import type { ProfileServices } from '../../../src/features/auth/application/profile-services'
import { createSignInLockRepository } from '../../../src/features/auth/data/sign-in-lock-repository'
import { profileSchema } from '../../../src/features/auth/schemas'
import type { Auth } from '../../../src/server/auth/auth'
import { readSession } from '../../../src/server/auth/session'
import { sessions, users } from '../../../src/server/db/schema/account'
import { notificationSettings } from '../../../src/server/db/schema/reminders'
import { insertBasics } from '../../helpers/db-fixtures'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { createCredentialUser, createTestAuth, signInForCookie } from './auth-fixtures'

// Erfundene Passwörter, nur für diese Wegwerf-Datenbank
const OLD_PASSWORD = 'Linse-Regal-Hafer-Wolke'
const NEW_PASSWORD = 'Dose Kerze Wasser Radio'
const NOW = new Date('2026-11-23T08:30:00Z')

describe('Mein Konto (#75, #89)', () => {
  let testDb: TestDb
  let auth: Auth
  let householdId: string
  let userId: string
  let username: string

  const services = (isMailConfigured = true): ProfileServices => ({
    db: testDb.db,
    auth,
    locks: createSignInLockRepository(testDb.db),
    isMailConfigured,
    now: () => NOW,
  })

  const signIn = (password = OLD_PASSWORD) => signInForCookie(auth, { username, password })

  beforeAll(async () => {
    testDb = await createTestDb()
    auth = createTestAuth(testDb.db)
    householdId = (await insertBasics(testDb.db)).householdId
  })

  beforeEach(async () => {
    username = `konto_${String(Date.now()).slice(-8)}`
    userId = await createCredentialUser(auth, { username, password: OLD_PASSWORD, householdId })
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('ändert Anzeigenamen und Adresse nur beim eigenen Nutzer', async () => {
    const other = await createCredentialUser(auth, {
      username: `${username}_b`,
      password: OLD_PASSWORD,
      householdId,
    })
    const input = profileSchema.parse({ displayName: ' Sam ', reminderEmail: ' Sam@Example.org ' })

    await updateOwnProfile(services(), { userId, input })

    const profile = await getOwnProfile(services(), userId)
    expect(profile).toMatchObject({ displayName: 'Sam', reminderEmail: 'sam@example.org' })
    expect((await getOwnProfile(services(), other))?.reminderEmail).toBeNull()
    // Die technische Adresse für Better Auth bleibt, wie sie ist
    const [row] = await testDb.db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
    expect(row?.email).toBe(`${userId}@nutzer.invalid`)
  })

  it('leert die Adresse, wenn das Feld leer ist', () => {
    expect(
      profileSchema.parse({ displayName: 'Sam', reminderEmail: '  ' }).reminderEmail,
    ).toBeNull()
    expect(profileSchema.safeParse({ displayName: 'Sam', reminderEmail: 'kein-at' }).success).toBe(
      false,
    )
  })

  it('lehnt ein falsches bisheriges Passwort ab und ändert nichts', async () => {
    const { requestHeaders } = await signIn()
    const input = {
      currentPassword: 'falsch-falsch',
      newPassword: NEW_PASSWORD,
      endOtherSessions: true,
    }

    const result = await changeOwnPassword(services(), { userId, headers: requestHeaders, input })

    expect(result).toEqual({ ok: false, error: { kind: 'wrong-password' } })
    await expect(signIn()).resolves.toBeDefined()
  })

  it('bremst nach fünf falschen bisherigen Passwörtern, auch das richtige', async () => {
    const { requestHeaders } = await signIn()
    const attempt = (currentPassword: string) =>
      changeOwnPassword(services(), {
        userId,
        headers: requestHeaders,
        input: { currentPassword, newPassword: NEW_PASSWORD, endOtherSessions: false },
      })

    for (let count = 0; count < 5; count += 1) await attempt('falsch-falsch')

    expect(await attempt(OLD_PASSWORD)).toEqual({
      ok: false,
      error: { kind: 'throttled', minutes: 1 },
    })
    await expect(signIn()).resolves.toBeDefined()
  })

  it('lehnt ein Passwort mit dem Benutzernamen ab', async () => {
    const { requestHeaders } = await signIn()
    const input = {
      currentPassword: OLD_PASSWORD,
      newPassword: `${username} ist mein Passwort`,
      endOtherSessions: false,
    }

    const result = await changeOwnPassword(services(), { userId, headers: requestHeaders, input })

    expect(result).toEqual({
      ok: false,
      error: { kind: 'weak-password', problem: 'contains-username' },
    })
  })

  it('ändert das Passwort, das alte gilt sofort nicht mehr, andere Geräte sind abgemeldet', async () => {
    const other = await signIn()
    const current = await signIn()
    await testDb.db.update(users).set({ isPasswordTemporary: true }).where(eq(users.id, userId))
    const input = {
      currentPassword: OLD_PASSWORD,
      newPassword: NEW_PASSWORD,
      endOtherSessions: true,
    }

    const result = await changeOwnPassword(services(), {
      userId,
      headers: current.requestHeaders,
      input,
    })

    expect(result).toEqual({ ok: true, value: null })
    expect(await readSession(auth, other.requestHeaders)).toBeNull()
    await expect(signIn(OLD_PASSWORD)).rejects.toThrow()
    await expect(signIn(NEW_PASSWORD)).resolves.toBeDefined()
    const profile = await getOwnProfile(services(), userId)
    expect(profile).toMatchObject({
      isPasswordTemporary: false,
      passwordChangedAt: NOW,
      passwordChangedByName: 'Alex',
    })
  })

  it('lässt andere Geräte angemeldet, wenn das gewählt ist', async () => {
    const other = await signIn()
    const current = await signIn()
    const input = {
      currentPassword: OLD_PASSWORD,
      newPassword: NEW_PASSWORD,
      endOtherSessions: false,
    }

    await changeOwnPassword(services(), { userId, headers: current.requestHeaders, input })

    expect((await readSession(auth, other.requestHeaders))?.id).toBe(userId)
    const remaining = await testDb.db.select().from(sessions).where(eq(sessions.userId, userId))
    expect(remaining.length).toBeGreaterThanOrEqual(2)
  })

  it('schaltet die Check-in-Mail nur mit Adresse und Mailversand ein', async () => {
    expect(await saveOwnCheckIn(services(), { userId, choice: 'woechentlich' })).toEqual({
      ok: false,
      error: { kind: 'mail-unavailable' },
    })
    await updateOwnProfile(services(), {
      userId,
      input: { displayName: 'Alex', reminderEmail: 'alex@example.org' },
    })
    expect(
      await saveOwnCheckIn(services(false), { userId, choice: 'monatlich' }).then((r) => r.ok),
    ).toBe(false)

    expect(await saveOwnCheckIn(services(), { userId, choice: 'monatlich' })).toEqual({
      ok: true,
      value: null,
    })
    expect((await getOwnProfile(services(), userId))?.checkInCadence).toBe('monatlich')

    await saveOwnCheckIn(services(false), { userId, choice: 'aus' })
    const [setting] = await testDb.db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.userId, userId))
    expect(setting).toMatchObject({ kind: 'checkin_mail', isEnabled: false, schedule: null })
    expect((await getOwnProfile(services(), userId))?.checkInCadence).toBeNull()
  })
})
