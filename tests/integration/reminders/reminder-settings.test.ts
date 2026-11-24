// Erinnerungen einstellen gegen eine echte Datenbank (#89): Speichern betrifft nur den eigenen
// Haushalt und lässt die Merker stehen, und der Worker hält sich an die gespeicherten Werte.
import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  buildHousehold,
  buildHouseholdSettings,
  buildProduct,
  buildUnit,
  buildUser,
} from '../../../db/seeds/factories'
import { createStockReadRepository } from '../../../src/features/inventory/data/stock-read-repository'
import {
  getReminderSettings,
  saveReminderSettings,
} from '../../../src/features/reminders/application/reminder-settings'
import { noPush } from '../../../src/features/reminders/application/reminder-push'
import { sendDueReminders } from '../../../src/features/reminders/application/send-due-reminders'
import { createReminderRepository } from '../../../src/features/reminders/data/reminder-repository'
import { createReminderSettingsRepository } from '../../../src/features/reminders/data/reminder-settings-repository'
import type { ReminderSettings } from '../../../src/features/reminders/domain/reminder-settings'
import { users } from '../../../src/server/db/schema/account'
import { householdSettings, households } from '../../../src/server/db/schema/household'
import { products, units } from '../../../src/server/db/schema/inventory'
import { insertBasics, type Basics } from '../../helpers/db-fixtures'
import { createFakeMailSender } from '../../helpers/fake-mail-sender'
import { createMemoryLogger } from '../../helpers/memory-logger'
import { createTestDb, type TestDb } from '../../helpers/test-db'

let testDb: TestDb
let basics: Basics
let foreignId: string
const sentBefore = new Date('2026-11-21T09:05:00Z')

const tuesdayEvening: ReminderSettings = {
  weeklySummary: { isEnabled: true, weekday: 2, time: '18:30' },
  isUrgentEnabled: false,
}

const settingsDeps = () => ({ settings: createReminderSettingsRepository(testDb.db) })

beforeAll(async () => {
  testDb = await createTestDb()
  basics = await insertBasics(testDb.db)
  const foreign = buildHousehold()
  foreignId = foreign.id
  await testDb.db.insert(households).values(foreign)
  await testDb.db
    .insert(householdSettings)
    .values([
      { ...buildHouseholdSettings({ householdId: basics.householdId }), urgentSentAt: sentBefore },
      buildHouseholdSettings({ householdId: foreignId }),
    ])
  await testDb.db
    .update(users)
    .set({ reminderEmail: 'alex@example.org' })
    .where(eq(users.id, basics.userId))
  const foreignUser = buildUser({ householdId: foreignId, reminderEmail: 'fremd@example.org' })
  await testDb.db.insert(users).values(foreignUser)
  const foreignProduct = buildProduct({ householdId: foreignId, categoryId: basics.categoryId })
  await testDb.db.insert(products).values(foreignProduct)
  const dueUnit = { captureId: basics.captureId, bestBefore: '2026-11-27' }
  await testDb.db
    .insert(units)
    .values([
      buildUnit({ ...dueUnit, productId: basics.productId }),
      buildUnit({ ...dueUnit, productId: foreignProduct.id }),
    ])
})

afterAll(async () => {
  await testDb.close()
})

describe('Erinnerungen einstellen', () => {
  it('liest die Standards des Haushalts', async () => {
    expect(await getReminderSettings(settingsDeps(), basics.householdId)).toEqual({
      weeklySummary: { isEnabled: true, weekday: 6, time: '10:00' },
      isUrgentEnabled: true,
    })
  })

  it('ändert nur den eigenen Haushalt und lässt die Merker stehen', async () => {
    await saveReminderSettings(settingsDeps(), {
      householdId: basics.householdId,
      settings: tuesdayEvening,
    })

    expect(await getReminderSettings(settingsDeps(), basics.householdId)).toEqual(tuesdayEvening)
    expect(await getReminderSettings(settingsDeps(), foreignId)).toEqual({
      weeklySummary: { isEnabled: true, weekday: 6, time: '10:00' },
      isUrgentEnabled: true,
    })
    const [own] = await testDb.db
      .select({ urgentSentAt: householdSettings.urgentSentAt })
      .from(householdSettings)
      .where(eq(householdSettings.householdId, basics.householdId))
    expect(own?.urgentSentAt).toEqual(sentBefore)
  })

  it('legt die Zeile an, wenn ein Haushalt noch keine hat', async () => {
    const fresh = buildHousehold()
    await testDb.db.insert(households).values(fresh)
    expect(await settingsDeps().settings.read(fresh.id)).toBeNull()

    await saveReminderSettings(settingsDeps(), { householdId: fresh.id, settings: tuesdayEvening })

    expect(await getReminderSettings(settingsDeps(), fresh.id)).toEqual(tuesdayEvening)
  })
})

describe('Der Worker hält sich an die gespeicherten Einstellungen', () => {
  function workerDeps() {
    const mail = createFakeMailSender()
    const deps = {
      reader: createStockReadRepository(testDb.db),
      repository: createReminderRepository(testDb.db),
      goals: {
        loadGoalStatus: () => Promise.resolve(null),
        countOpenRestockItems: () => Promise.resolve(0),
      },
      push: noPush,
      mail,
      appUrl: null,
      logger: createMemoryLogger().logger,
    }
    return { deps, mail }
  }

  it('schickt die Wochenübersicht am gewählten Dienstag ab 18:30, nicht am Samstag', async () => {
    const { deps, mail } = workerDeps()

    await sendDueReminders(deps, new Date('2026-11-24T17:20:00Z')) // Di 18:20 Uhr
    expect(mail.sent).toEqual([])

    await sendDueReminders(deps, new Date('2026-11-24T17:35:00Z')) // Di 18:35 Uhr
    // Der fremde Haushalt hat Samstag gewählt und bekommt nichts
    expect(mail.sent.map((message) => message.to)).toEqual(['alex@example.org'])

    await sendDueReminders(deps, new Date('2026-11-28T09:05:00Z')) // Sa 10:05 Uhr
    expect(mail.sent.map((message) => message.to)).toEqual([
      'alex@example.org',
      'fremd@example.org',
    ])
  })

  it('schickt nichts mehr, wenn die Wochenübersicht ausgeschaltet ist', async () => {
    await saveReminderSettings(settingsDeps(), {
      householdId: basics.householdId,
      settings: {
        ...tuesdayEvening,
        weeklySummary: { ...tuesdayEvening.weeklySummary, isEnabled: false },
      },
    })
    const { deps, mail } = workerDeps()

    await sendDueReminders(deps, new Date('2026-12-01T17:35:00Z')) // Di 18:35 Uhr

    expect(mail.sent).toEqual([])
  })
})
