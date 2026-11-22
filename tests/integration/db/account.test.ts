import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
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

  it('legt einen Nutzer mit Standardrolle mitglied und aktiv an', async () => {
    const [user] = await testDb.db
      .insert(users)
      .values({ name: 'Alex', email: 'alex@example.org' })
      .returning()

    expect(user).toMatchObject({ role: 'mitglied', isActive: true, emailVerified: false })
  })

  it('lehnt eine unbekannte Rolle ab', async () => {
    await expectConstraintViolation(
      testDb.db
        .insert(users)
        // @ts-expect-error -- absichtlich ungültige Rolle, die nur die DB abfangen soll
        .values({ name: 'Sam', email: 'sam@example.org', role: 'gast' }),
      'nutzer_rolle_check',
    )
  })

  it('lehnt eine doppelte E-Mail ab', async () => {
    await testDb.db.insert(users).values({ name: 'Kim', email: 'kim@example.org' })

    await expectConstraintViolation(
      testDb.db.insert(users).values({ name: 'Kim 2', email: 'kim@example.org' }),
      'nutzer_email_unique',
    )
  })

  it('löscht die Sitzungen mit dem Nutzer', async () => {
    const [user] = await testDb.db
      .insert(users)
      .values({ name: 'Sam', email: 'sam.sitzung@example.org', role: 'admin' })
      .returning()
    if (user === undefined) throw new Error('Nutzer fehlt')
    await testDb.db.insert(sessions).values({
      token: 'token-zum-test',
      expiresAt: new Date('2030-01-01T00:00:00Z'),
      userId: user.id,
    })

    await testDb.db.delete(users).where(eq(users.id, user.id))

    expect(await testDb.db.select().from(sessions).where(eq(sessions.userId, user.id))).toEqual([])
  })
})
