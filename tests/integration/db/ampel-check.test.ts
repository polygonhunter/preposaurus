// Ampel-Schwellen in der DB (E-21, #135): Orange mindestens 7 Tage und höchstens Gelb.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { THIS_WEEK_DAYS } from '../../../src/features/inventory/domain/unit-state'
import { URGENT_WINDOW_DAYS } from '../../../src/features/reminders/domain/urgent'
import { householdSettings, households } from '../../../src/server/db/schema/household'
import { MIN_AMPEL_ORANGE_DAYS } from '../../../src/shared/config/constants'
import { expectConstraintViolation } from '../../helpers/db-errors'
import { createTestDb, type TestDb } from '../../helpers/test-db'

const CHECK = 'haushalt_einstellung_ampel_check'

describe('Ampel-CHECK der Haushaltseinstellung', () => {
  let testDb: TestDb

  const insertSettings = async (ampel: { ampelYellowDays: number; ampelOrangeDays: number }) => {
    const [household] = await testDb.db
      .insert(households)
      .values({
        name: `Haushalt ${String(ampel.ampelOrangeDays)}/${String(ampel.ampelYellowDays)}`,
      })
      .returning()
    if (household === undefined) throw new Error('Haushalt fehlt')
    return testDb.db
      .insert(householdSettings)
      .values({ householdId: household.id, ...ampel })
      .returning()
  }

  beforeAll(async () => {
    testDb = await createTestDb()
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('nutzt dieselbe Untergrenze wie die Fachlogik', () => {
    expect(MIN_AMPEL_ORANGE_DAYS).toBe(THIS_WEEK_DAYS)
  })

  it('meldet „Dringend“ für dieselbe Gruppe „Diese Woche“', () => {
    expect(URGENT_WINDOW_DAYS).toBe(THIS_WEEK_DAYS)
  })

  it('lehnt eine orange Schwelle unter 7 Tagen ab', async () => {
    await expectConstraintViolation(
      insertSettings({ ampelYellowDays: 90, ampelOrangeDays: 6 }),
      CHECK,
    )
  })

  it('lehnt eine orange Schwelle von 0 Tagen ab', async () => {
    await expectConstraintViolation(
      insertSettings({ ampelYellowDays: 90, ampelOrangeDays: 0 }),
      CHECK,
    )
  })

  it('lehnt eine orange Schwelle über der gelben ab', async () => {
    await expectConstraintViolation(
      insertSettings({ ampelYellowDays: 20, ampelOrangeDays: 30 }),
      CHECK,
    )
  })

  it('erlaubt genau 7 Tage und Orange gleich Gelb', async () => {
    const [atMinimum] = await insertSettings({ ampelYellowDays: 7, ampelOrangeDays: 7 })

    expect(atMinimum).toMatchObject({ ampelYellowDays: 7, ampelOrangeDays: 7 })
  })
})
