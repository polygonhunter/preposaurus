import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { aiSettings } from '../../../src/server/db/schema/ai-settings'
import { households } from '../../../src/server/db/schema/household'
import { expectConstraintViolation } from '../../helpers/db-errors'
import { createTestDb, type TestDb } from '../../helpers/test-db'

describe('Schema KI-Einstellung (Issue #108)', () => {
  let testDb: TestDb

  const insertHousehold = async () => {
    const [household] = await testDb.db.insert(households).values({ name: 'Test' }).returning()
    return household?.id ?? ''
  }

  beforeAll(async () => {
    testDb = await createTestDb()
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('startet ohne Schlüssel und ohne Test, Anbieter ist Anthropic', async () => {
    const [settings] = await testDb.db
      .insert(aiSettings)
      .values({ householdId: await insertHousehold() })
      .returning()

    expect(settings).toMatchObject({
      provider: 'anthropic',
      apiKeyCiphertext: null,
      modelPackaging: null,
      lastTestStatus: null,
    })
  })

  it('lehnt ein Chiffrat ohne IV und Tag ab', async () => {
    await expectConstraintViolation(
      testDb.db
        .insert(aiSettings)
        .values({ householdId: await insertHousehold(), apiKeyCiphertext: 'Y2lwaGVy' }),
      'ki_einstellung_schluessel_check',
    )
  })

  it('verlangt zum Teststatus den Zeitpunkt', async () => {
    await expectConstraintViolation(
      testDb.db
        .insert(aiSettings)
        .values({ householdId: await insertHousehold(), lastTestStatus: 'ok' }),
      'ki_einstellung_test_check',
    )
  })

  it('erlaubt nur eine KI-Einstellung je Haushalt', async () => {
    const householdId = await insertHousehold()
    await testDb.db.insert(aiSettings).values({ householdId })

    await expectConstraintViolation(
      testDb.db.insert(aiSettings).values({ householdId }),
      'ki_einstellung_haushalt_id_unique',
    )
  })
})
