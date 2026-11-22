import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { users } from '../../../src/server/db/schema/account'
import {
  householdSettings,
  households,
  memberAllergies,
  members,
} from '../../../src/server/db/schema/household'
import { buildUser } from '../../../db/seeds/factories'
import { expectConstraintViolation } from '../../helpers/db-errors'
import { createTestDb, type TestDb } from '../../helpers/test-db'

describe('Schema Haushalt', () => {
  let testDb: TestDb
  let householdId: string

  const insertHousehold = async (name: string) => {
    const [household] = await testDb.db.insert(households).values({ name }).returning()
    if (household === undefined) throw new Error('Haushalt fehlt')
    return household.id
  }

  beforeAll(async () => {
    testDb = await createTestDb()
    householdId = await insertHousehold('Beispielhaushalt')
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('setzt die Standardwerte der Einstellungen (Ampel 90/28, KI aus, Noch gut zählt nicht)', async () => {
    const [settings] = await testDb.db.insert(householdSettings).values({ householdId }).returning()

    expect(settings).toMatchObject({
      defaultDiet: 'alles',
      ampelYellowDays: 90,
      ampelOrangeDays: 28,
      isAiEnabled: false,
      stillGoodCountsAsSupplied: false,
      weeklySummaryEnabled: true,
      weeklySummaryWeekday: 6,
      weeklySummaryTime: '10:00:00',
      urgentEnabled: true,
      setupCompletedAt: null,
      setupStep: null,
    })
  })

  it('lehnt einen negativen Einrichtungsschritt ab', async () => {
    const otherId = await insertHousehold('Einrichtungs-Haushalt')

    await expectConstraintViolation(
      testDb.db.insert(householdSettings).values({ householdId: otherId, setupStep: -1 }),
      'haushalt_einstellung_einrichtung_schritt_check',
    )
  })

  it('lehnt einen Wochentag außerhalb von 1 bis 7 ab', async () => {
    const otherId = await insertHousehold('Wochentag-Haushalt')

    await expectConstraintViolation(
      testDb.db.insert(householdSettings).values({ householdId: otherId, weeklySummaryWeekday: 0 }),
      'haushalt_einstellung_wochentag_check',
    )
  })

  it('lehnt eine orange Schwelle über der gelben ab', async () => {
    const otherId = await insertHousehold('Zweiter Haushalt')

    await expectConstraintViolation(
      testDb.db
        .insert(householdSettings)
        .values({ householdId: otherId, ampelYellowDays: 20, ampelOrangeDays: 30 }),
      'haushalt_einstellung_ampel_check',
    )
  })

  it('lehnt einen unbekannten Mitgliedstyp ab', async () => {
    await expectConstraintViolation(
      testDb.db
        .insert(members)
        // @ts-expect-error -- absichtlich ungültiger Typ, den nur die DB abfangen soll
        .values({ householdId, name: 'Kim', type: 'haustier' }),
      'mitglied_typ_check',
    )
  })

  it('löscht Allergien mit dem Mitglied und löst die Verknüpfung zum Nutzer', async () => {
    const [member] = await testDb.db
      .insert(members)
      .values({ householdId, name: 'Kim', type: 'kind', diet: 'vegetarisch' })
      .returning()
    if (member === undefined) throw new Error('Mitglied fehlt')
    await testDb.db.insert(memberAllergies).values({ memberId: member.id, label: 'glutenfrei' })
    const [user] = await testDb.db
      .insert(users)
      .values(buildUser({ name: 'Kim', householdId, memberId: member.id }))
      .returning()

    await testDb.db.delete(members).where(eq(members.id, member.id))

    expect(await testDb.db.select().from(memberAllergies)).toEqual([])
    const [reloaded] = await testDb.db
      .select()
      .from(users)
      .where(eq(users.id, user?.id ?? ''))
    expect(reloaded?.memberId).toBeNull()
  })
})
