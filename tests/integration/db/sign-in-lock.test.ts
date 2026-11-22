import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { signInLocks } from '../../../src/server/db/schema/sign-in-lock'
import { expectConstraintViolation } from '../../helpers/db-errors'
import { createTestDb, type TestDb } from '../../helpers/test-db'

describe('Schema Anmeldebremse', () => {
  let testDb: TestDb

  beforeAll(async () => {
    testDb = await createTestDb()
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('zählt auch unbekannte Benutzernamen, ohne Bezug auf einen Nutzer', async () => {
    const [lock] = await testDb.db
      .insert(signInLocks)
      .values({ key: 'name:gibtesnicht', failedAttempts: 1, lastFailedAt: new Date() })
      .returning()

    expect(lock).toMatchObject({ failedAttempts: 1, lockedUntil: null })
  })

  it('erlaubt je Schlüssel nur eine Zeile', async () => {
    await testDb.db.insert(signInLocks).values({ key: 'ip:192.0.2.1' })

    await expectConstraintViolation(
      testDb.db.insert(signInLocks).values({ key: 'ip:192.0.2.1' }),
      'anmelde_sperre_schluessel_unique',
    )
  })

  it('lehnt einen Schlüssel ohne Präfix name: oder ip: ab', async () => {
    await expectConstraintViolation(
      testDb.db.insert(signInLocks).values({ key: 'alex' }),
      'anmelde_sperre_schluessel_check',
    )
  })

  it('nimmt den Schlüssel global an, aber nichts, das nur damit beginnt', async () => {
    await testDb.db.insert(signInLocks).values({ key: 'global' })

    await expectConstraintViolation(
      testDb.db.insert(signInLocks).values({ key: 'globalx' }),
      'anmelde_sperre_schluessel_check',
    )
  })
})
