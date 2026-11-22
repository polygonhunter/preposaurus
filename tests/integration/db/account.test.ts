import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildUser } from '../../../db/seeds/factories'
import { sessions, users } from '../../../src/server/db/schema/account'
import { expectConstraintViolation } from '../../helpers/db-errors'
import { createTestDb, type TestDb } from '../../helpers/test-db'

describe('Schema Konto', () => {
  let testDb: TestDb

  beforeAll(async () => {
    testDb = await createTestDb()
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('legt einen Nutzer mit Standardrolle mitglied, aktiv und ohne vorläufiges Passwort an', async () => {
    const [user] = await testDb.db
      .insert(users)
      .values(buildUser({ name: 'Alex', username: 'alex', role: undefined }))
      .returning()

    expect(user).toMatchObject({
      role: 'mitglied',
      isActive: true,
      emailVerified: false,
      isPasswordTemporary: false,
      lastSignInAt: null,
    })
  })

  it('lehnt eine unbekannte Rolle ab', async () => {
    await expectConstraintViolation(
      // @ts-expect-error -- absichtlich ungültige Rolle, die nur die DB abfangen soll
      testDb.db.insert(users).values(buildUser({ username: 'sam', role: 'gast' })),
      'nutzer_rolle_check',
    )
  })

  it('lehnt einen doppelten Benutzernamen ab (eindeutig über lower())', async () => {
    await testDb.db.insert(users).values(buildUser({ username: 'kim' }))

    await expectConstraintViolation(
      testDb.db.insert(users).values(buildUser({ username: 'kim' })),
      'nutzer_benutzername_eindeutig',
    )
  })

  it.each(['ab', 'mit leerzeichen', 'gross_A', 'a'.repeat(31), '...', '._.', '_alex', 'alex-m'])(
    'lehnt den Benutzernamen „%s“ ab',
    async (username) => {
      await expectConstraintViolation(
        testDb.db.insert(users).values(buildUser({ username })),
        'nutzer_benutzername_check',
      )
    },
  )

  it.each(['alex.m', 'a.b', 'sam_1', '1kim'])(
    'nimmt den Benutzernamen „%s“ an',
    async (username) => {
      await expect(testDb.db.insert(users).values(buildUser({ username }))).resolves.toBeDefined()
    },
  )

  it('lehnt eine doppelte (technische) E-Mail ab', async () => {
    const email = 'doppelt@nutzer.invalid'
    await testDb.db.insert(users).values(buildUser({ username: 'erste', email }))

    await expectConstraintViolation(
      testDb.db.insert(users).values(buildUser({ username: 'zweite', email })),
      'nutzer_email_unique',
    )
  })

  it('löscht die Sitzungen mit dem Nutzer', async () => {
    const user = buildUser({ username: 'sam.sitzung', role: 'admin' })
    await testDb.db.insert(users).values(user)
    await testDb.db.insert(sessions).values({
      token: 'token-zum-test',
      expiresAt: new Date('2030-01-01T00:00:00Z'),
      userId: user.id,
    })

    await testDb.db.delete(users).where(eq(users.id, user.id))

    expect(await testDb.db.select().from(sessions).where(eq(sessions.userId, user.id))).toEqual([])
  })
})
