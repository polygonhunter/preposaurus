import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { listUsersFromCli } from '../../../src/features/auth/application/list-users-from-cli'
import { makeAdminFromCli } from '../../../src/features/auth/application/make-admin-from-cli'
import { signOutEveryoneFromCli } from '../../../src/features/auth/application/sign-out-everyone-from-cli'
import {
  createEmergencyUserRepository,
  type EmergencyUserRepository,
} from '../../../src/features/auth/data/emergency-user-repository'
import type { Auth } from '../../../src/server/auth/auth'
import { readSession } from '../../../src/server/auth/session'
import { sessions, users } from '../../../src/server/db/schema/account'
import { insertBasics } from '../../helpers/db-fixtures'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { createCredentialUser, createTestAuth, signInForCookie } from './auth-fixtures'

const PASSWORD = 'Linse-Regal-Hafer-Wolke'
const lastSignIn = new Date('2026-11-20T08:30:00Z')

describe('Notfall-Befehle der Kommandozeile', () => {
  let testDb: TestDb
  let auth: Auth
  let repository: EmergencyUserRepository
  let alexId: string
  let samId: string

  const userRow = async (id: string) =>
    (await testDb.db.select().from(users).where(eq(users.id, id)))[0]

  beforeAll(async () => {
    testDb = await createTestDb()
    auth = createTestAuth(testDb.db)
    repository = createEmergencyUserRepository(testDb.db)
    const { householdId } = await insertBasics(testDb.db)
    alexId = await createCredentialUser(auth, { username: 'alex', password: PASSWORD, householdId })
    samId = await createCredentialUser(auth, { username: 'sam', password: PASSWORD, householdId })
  })

  beforeEach(async () => {
    await testDb.db.delete(sessions)
    await testDb.db.update(users).set({ role: 'admin', isActive: true }).where(eq(users.id, alexId))
    await testDb.db
      .update(users)
      .set({ role: 'mitglied', isActive: true, lastSignInAt: null })
      .where(eq(users.id, samId))
  })

  afterAll(async () => {
    await testDb.close()
  })

  describe('nutzer-auflisten', () => {
    it('zeigt Name, Rolle, Status und letzte Anmeldung, sortiert nach Benutzername', async () => {
      await testDb.db
        .update(users)
        .set({ isActive: false, lastSignInAt: lastSignIn })
        .where(eq(users.id, samId))

      const list = await listUsersFromCli(repository)

      // insertBasics legt einen weiteren Nutzer (nutzer_…) an, der hinter alex und sam steht.
      expect(list.map((user) => user.username)).toEqual(
        list.map((user) => user.username).sort((a, b) => a.localeCompare(b)),
      )
      expect(list.filter((user) => ['alex', 'sam'].includes(user.username))).toEqual([
        { username: 'alex', name: 'Alex', role: 'admin', isActive: true, lastSignInAt: null },
        {
          username: 'sam',
          name: 'Alex',
          role: 'mitglied',
          isActive: false,
          lastSignInAt: lastSignIn,
        },
      ])
    })

    it('liefert keine Hashes, E-Mails oder IDs', async () => {
      const [first] = await listUsersFromCli(repository)

      expect(Object.keys(first ?? {}).sort()).toEqual(
        ['isActive', 'lastSignInAt', 'name', 'role', 'username'].sort(),
      )
    })
  })

  describe('admin-machen', () => {
    it('reaktiviert einen deaktivierten Nutzer und macht ihn zum Admin', async () => {
      await testDb.db.update(users).set({ isActive: false }).where(eq(users.id, samId))

      const result = await makeAdminFromCli(repository, '  Sam ')

      expect(result).toEqual({
        ok: true,
        value: { username: 'sam', wasAdmin: false, wasActive: false },
      })
      expect(await userRow(samId)).toMatchObject({ role: 'admin', isActive: true })
      await expect(
        signInForCookie(auth, { username: 'sam', password: PASSWORD }),
      ).resolves.toBeDefined()
    })

    it('meldet, wenn der Nutzer schon aktiver Admin ist', async () => {
      const result = await makeAdminFromCli(repository, 'alex')

      expect(result).toEqual({
        ok: true,
        value: { username: 'alex', wasAdmin: true, wasActive: true },
      })
    })

    it('lässt andere Nutzer unangetastet', async () => {
      await makeAdminFromCli(repository, 'sam')

      expect(await userRow(alexId)).toMatchObject({ role: 'admin', isActive: true })
    })

    it('ändert nichts bei einem unbekannten Namen', async () => {
      const result = await makeAdminFromCli(repository, 'niemand')

      expect(result).toEqual({ ok: false, error: { kind: 'not-found' } })
      expect(await userRow(samId)).toMatchObject({ role: 'mitglied' })
    })

    it('lehnt einen Namen außerhalb des Musters ab, ohne die DB zu fragen', async () => {
      const result = await makeAdminFromCli(
        {
          makeActiveAdmin: () => {
            throw new Error('Die DB darf nicht gefragt werden')
          },
        },
        '../etc',
      )

      expect(result).toEqual({ ok: false, error: { kind: 'invalid-username' } })
    })
  })

  describe('alle-abmelden', () => {
    it('beendet die Sitzungen aller Nutzer, die Cookies gelten danach nicht mehr', async () => {
      const alex = await signInForCookie(auth, { username: 'alex', password: PASSWORD })
      const sam = await signInForCookie(auth, { username: 'sam', password: PASSWORD })
      await signInForCookie(auth, { username: 'sam', password: PASSWORD })
      expect(await readSession(auth, alex.requestHeaders)).not.toBeNull()

      const ended = await signOutEveryoneFromCli(repository)

      expect(ended).toBe(3)
      expect(await testDb.db.select().from(sessions)).toEqual([])
      expect(await readSession(auth, alex.requestHeaders)).toBeNull()
      expect(await readSession(auth, sam.requestHeaders)).toBeNull()
    })

    it('lässt Konten und Passwörter bestehen, eine neue Anmeldung klappt', async () => {
      await signInForCookie(auth, { username: 'alex', password: PASSWORD })

      await signOutEveryoneFromCli(repository)

      await expect(
        signInForCookie(auth, { username: 'alex', password: PASSWORD }),
      ).resolves.toBeDefined()
      expect(await userRow(alexId)).toMatchObject({ role: 'admin', isActive: true })
    })

    it('meldet null, wenn niemand angemeldet ist', async () => {
      expect(await signOutEveryoneFromCli(repository)).toBe(0)
    })
  })
})
