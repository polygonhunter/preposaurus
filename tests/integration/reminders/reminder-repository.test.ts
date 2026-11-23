// Repository der Erinnerungen gegen eine echte Datenbank: Merker (SCHNITTSTELLEN Nr. 27),
// Erfassungszeitpunkte, Adressen und Check-in-Abos, jeweils nur für den eigenen Haushalt.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import {
  buildHousehold,
  buildHouseholdSettings,
  buildProduct,
  buildUnit,
  buildUser,
} from '../../../db/seeds/factories'
import { createReminderRepository } from '../../../src/features/reminders/data/reminder-repository'
import { users } from '../../../src/server/db/schema/account'
import { householdSettings, households } from '../../../src/server/db/schema/household'
import { products, units } from '../../../src/server/db/schema/inventory'
import { notificationSettings } from '../../../src/server/db/schema/reminders'
import { insertBasics, type Basics } from '../../helpers/db-fixtures'
import { createTestDb, type TestDb } from '../../helpers/test-db'

let testDb: TestDb
let basics: Basics
let foreignId: string
let repository: ReturnType<typeof createReminderRepository>
const ownUnitId = '00000000-0000-4000-8000-0000000000a1'
const foreignUnitId = '00000000-0000-4000-8000-0000000000b1'
const addedAt = new Date('2026-11-20T09:15:00Z')

async function insertForeignHousehold() {
  const household = buildHousehold()
  await testDb.db.insert(households).values(household)
  await testDb.db
    .insert(householdSettings)
    .values(buildHouseholdSettings({ householdId: household.id }))
  const product = buildProduct({ householdId: household.id, categoryId: basics.categoryId })
  await testDb.db.insert(products).values(product)
  const user = buildUser({ householdId: household.id, email: 'fremd@example.org' })
  await testDb.db.insert(users).values(user)
  return { householdId: household.id, productId: product.id }
}

beforeAll(async () => {
  testDb = await createTestDb()
  basics = await insertBasics(testDb.db)
  await testDb.db
    .insert(householdSettings)
    .values(buildHouseholdSettings({ householdId: basics.householdId }))
  const foreign = await insertForeignHousehold()
  foreignId = foreign.householdId
  const unit = { productId: basics.productId, captureId: basics.captureId }
  await testDb.db
    .insert(units)
    .values([
      buildUnit({ ...unit, id: ownUnitId, bestBefore: '2026-11-25', createdAt: addedAt }),
      buildUnit({ ...unit, bestBefore: null }),
      buildUnit({ ...unit, bestBefore: null, status: 'verbraucht', takenAt: addedAt }),
      buildUnit({ productId: foreign.productId, captureId: basics.captureId, id: foreignUnitId }),
    ])
  repository = createReminderRepository(testDb.db)
})

afterAll(async () => {
  await testDb.close()
})

describe('createReminderRepository', () => {
  it('liest Zeitplan und Merker je Haushalt mit den Standardwerten', async () => {
    const own = (await repository.listHouseholds()).find(
      (state) => state.householdId === basics.householdId,
    )
    expect(own).toEqual({
      householdId: basics.householdId,
      settings: {
        weeklySummary: { isEnabled: true, weekday: 6, time: '10:00:00' },
        isUrgentEnabled: true,
      },
      lastSent: { 'weekly-summary': null, urgent: null },
    })
  })

  it('setzt nur die genannten Merker und nur im eigenen Haushalt', async () => {
    const at = new Date('2026-11-24T08:00:00Z')
    await repository.markSent(basics.householdId, ['urgent'], at)

    const states = await repository.listHouseholds()
    const own = states.find((state) => state.householdId === basics.householdId)
    const foreign = states.find((state) => state.householdId === foreignId)
    expect(own?.lastSent).toEqual({ 'weekly-summary': null, urgent: at })
    expect(foreign?.lastSent).toEqual({ 'weekly-summary': null, urgent: null })
  })

  it('liefert Erfassungszeitpunkte nur für Packungen des eigenen Haushalts', async () => {
    const times = await repository.loadAddedTimes(basics.householdId, [ownUnitId, foreignUnitId])
    expect([...times]).toEqual([[ownUnitId, addedAt]])
    expect(await repository.loadAddedTimes(basics.householdId, [])).toEqual(new Map())
  })

  it('zählt Packungen im Vorrat ohne Datum', async () => {
    expect(await repository.countMissingDates(basics.householdId)).toBe(1)
  })

  it('nennt die Adressen aktiver Nutzer des Haushalts', async () => {
    const inactive = buildUser({ householdId: basics.householdId, isActive: false })
    await testDb.db.insert(users).values({ ...inactive, email: 'alt@example.org' })
    await testDb.db
      .update(users)
      .set({ email: 'alex@example.org' })
      .where(eq(users.id, basics.userId))

    expect(await repository.listAddresses(basics.householdId)).toEqual(['alex@example.org'])
  })

  it('findet Check-in-Abos nach Rhythmus, nur eingeschaltete', async () => {
    const off = buildUser({ householdId: basics.householdId, email: 'aus@example.org' })
    await testDb.db.insert(users).values(off)
    await testDb.db.insert(notificationSettings).values([
      { userId: basics.userId, kind: 'checkin_mail', schedule: 'woechentlich' },
      { userId: off.id, kind: 'checkin_mail', schedule: 'woechentlich', isEnabled: false },
    ])

    expect(await repository.listCheckInRecipients('woechentlich')).toEqual([
      { householdId: basics.householdId, address: 'alex@example.org' },
    ])
    expect(await repository.listCheckInRecipients('monatlich')).toEqual([])
  })
})
