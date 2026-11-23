import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { buildHousehold, buildMember } from '../../../db/seeds/factories'
import { createUser } from '../../../src/features/auth/application/create-user'
import {
  changeUserRole,
  linkUserToMember,
  setUserActiveState,
} from '../../../src/features/auth/application/manage-users'
import { resetUserPassword } from '../../../src/features/auth/application/reset-user-password'
import type { UserAdminServices } from '../../../src/features/auth/application/user-admin-services'
import { createPasswordResetRepository } from '../../../src/features/auth/data/password-reset-repository'
import { createUserAdminRepository } from '../../../src/features/auth/data/user-admin-repository'
import type { Auth } from '../../../src/server/auth/auth'
import { readSession } from '../../../src/server/auth/session'
import { accounts, sessions, users } from '../../../src/server/db/schema/account'
import { households, members } from '../../../src/server/db/schema/household'
import { signInLocks } from '../../../src/server/db/schema/sign-in-lock'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { createCredentialUser, createTestAuth, signInForCookie } from './auth-fixtures'

const ADMIN_PASSWORD = 'Linse-Regal-Hafer-Wolke'
const GENERATED = ['tuvw-xyz2-3456-789a-bcde', 'fghj-kmnp-qrst-uvwx-yz23']

describe('Nutzerverwaltung gegen die Datenbank', () => {
  let testDb: TestDb
  let auth: Auth
  let services: UserAdminServices
  let householdId: string
  let adminId: string
  const draws: string[] = []

  beforeAll(async () => {
    testDb = await createTestDb()
    auth = createTestAuth(testDb.db)
    const household = buildHousehold()
    await testDb.db.insert(households).values(household)
    householdId = household.id
    adminId = await createCredentialUser(auth, {
      username: 'alex',
      password: ADMIN_PASSWORD,
      householdId,
    })
    await testDb.db.update(users).set({ role: 'admin' }).where(eq(users.id, adminId))
    const { password } = await auth.$context
    services = {
      users: createUserAdminRepository(testDb.db),
      passwords: createPasswordResetRepository(testDb.db),
      hashPassword: (plain) => password.hash(plain),
      generatePassword: () => draws.shift() ?? 'kmnp-qrst-uvwx-yz23-4567',
      now: () => new Date(),
    }
  })

  beforeEach(() => {
    draws.splice(0, draws.length, ...GENERATED)
  })

  afterAll(async () => {
    await testDb.close()
  })

  const signIn = (username: string, password: string) =>
    signInForCookie(auth, { username, password })

  async function create(username: string, role: 'admin' | 'mitglied' = 'mitglied') {
    const result = await createUser(services, {
      householdId,
      actorId: adminId,
      input: { displayName: username, username, role, memberId: null, password: null },
    })
    if (!result.ok) throw new Error(`Anlegen von ${username} hätte klappen sollen`)
    return result.value
  }

  it('legt einen Nutzer an, der sich mit dem angezeigten Passwort anmeldet', async () => {
    const created = await create('robin')

    const [row] = await testDb.db.select().from(users).where(eq(users.id, created.userId))
    expect(row).toMatchObject({ role: 'mitglied', isPasswordTemporary: true, householdId })
    expect(row?.passwordChangedBy).toBe(adminId)
    const [account] = await testDb.db
      .select({ password: accounts.password })
      .from(accounts)
      .where(eq(accounts.userId, created.userId))
    expect(account?.password).not.toContain(created.password)
    const { requestHeaders } = await signIn('robin', created.password)
    expect((await readSession(auth, requestHeaders))?.username).toBe('robin')
  })

  it('lehnt einen vergebenen Benutzernamen ab, auch in anderer Schreibweise', async () => {
    const result = await createUser(services, {
      householdId,
      actorId: adminId,
      input: {
        displayName: 'Alex',
        username: 'alex',
        role: 'mitglied',
        memberId: null,
        password: null,
      },
    })

    expect(result).toEqual({ ok: false, error: { kind: 'username-taken' } })
  })

  it('nach dem Zurücksetzen gilt nur das neue Passwort, alle Sitzungen sind weg', async () => {
    const created = await create('kim')
    await signIn('kim', created.password)
    await testDb.db.insert(signInLocks).values({ key: 'name:kim', failedAttempts: 5 })

    const reset = await resetUserPassword(services, {
      householdId,
      actorId: adminId,
      userId: created.userId,
      password: null,
    })
    if (!reset.ok) throw new Error('Zurücksetzen hätte klappen sollen')

    expect(reset.value.password).not.toBe(created.password)
    expect(
      await testDb.db.select().from(sessions).where(eq(sessions.userId, created.userId)),
    ).toEqual([])
    expect(
      await testDb.db.select().from(signInLocks).where(eq(signInLocks.key, 'name:kim')),
    ).toEqual([])
    await expect(signIn('kim', created.password)).rejects.toThrow()
    await expect(signIn('kim', reset.value.password)).resolves.toBeDefined()
  })

  it('Deaktivieren beendet alle Sitzungen und sperrt die Anmeldung', async () => {
    const created = await create('jona')
    const { requestHeaders } = await signIn('jona', created.password)

    const result = await setUserActiveState(services, {
      householdId,
      actorId: adminId,
      userId: created.userId,
      isActive: false,
    })

    expect(result.ok).toBe(true)
    expect(await readSession(auth, requestHeaders)).toBeNull()
    expect(
      await testDb.db.select().from(sessions).where(eq(sessions.userId, created.userId)),
    ).toEqual([])
    await expect(signIn('jona', created.password)).rejects.toThrow()
  })

  it('zwei Admins, die sich gleichzeitig herabstufen: einer bleibt Admin', async () => {
    const second = await create('sasha', 'admin')

    const results = await Promise.all([
      changeUserRole(services, { householdId, userId: adminId, role: 'mitglied' }),
      changeUserRole(services, { householdId, userId: second.userId, role: 'mitglied' }),
    ])

    expect(results.filter((result) => result.ok)).toHaveLength(1)
    expect(results.filter((result) => !result.ok)).toEqual([
      { ok: false, error: { kind: 'last-admin' } },
    ])
    const admins = await testDb.db.select().from(users).where(eq(users.role, 'admin'))
    expect(admins.filter((admin) => admin.isActive)).toHaveLength(1)
    await testDb.db.update(users).set({ role: 'admin' }).where(eq(users.id, adminId))
  })

  it('verknüpft eine Person des eigenen Haushalts, nie eine fremde', async () => {
    const other = buildHousehold({ name: 'Fremder Haushalt' })
    await testDb.db.insert(households).values(other)
    const own = buildMember({ householdId, name: 'Alex' })
    const foreign = buildMember({ householdId: other.id, name: 'Fremd' })
    await testDb.db.insert(members).values([own, foreign])

    const linked = await linkUserToMember(services, {
      householdId,
      userId: adminId,
      memberId: own.id,
    })
    const rejected = await linkUserToMember(services, {
      householdId,
      userId: adminId,
      memberId: foreign.id,
    })

    expect(linked.ok).toBe(true)
    expect(rejected).toEqual({ ok: false, error: { kind: 'member-not-found' } })
    const listed = await services.users.find(householdId, adminId)
    expect(listed).toMatchObject({ memberId: own.id, memberName: 'Alex' })
    expect(await services.users.find(other.id, adminId)).toBeNull()
  })
})
