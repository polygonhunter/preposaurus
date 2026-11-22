import { eq, isNull } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { seedDemo } from '../../../db/seeds/demo'
import { seedMasterData } from '../../../db/seeds/master-data'
import { users } from '../../../src/server/db/schema/account'
import { captures } from '../../../src/server/db/schema/confirmed-captures'
import { households } from '../../../src/server/db/schema/household'
import { products, units } from '../../../src/server/db/schema/inventory'
import { AMPEL_OFFSETS, daysFrom } from '../../../db/seeds/factories'
import { createTestDb, type TestDb } from '../../helpers/test-db'

const TODAY = new Date('2026-11-22T12:00:00Z')

describe('Demo-Daten', () => {
  let testDb: TestDb
  let created: boolean

  beforeAll(async () => {
    testDb = await createTestDb()
    await seedMasterData(testDb.db)
    created = await seedDemo(testDb.db, TODAY)
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('legt auf leerer DB einen Beispielhaushalt mit Admin und Mitglied an', async () => {
    const people = await testDb.db
      .select({ username: users.username, role: users.role })
      .from(users)
      .orderBy(users.username)

    expect(created).toBe(true)
    expect(people).toEqual([
      { username: 'alex', role: 'admin' },
      { username: 'sam', role: 'mitglied' },
    ])
  })

  it('enthält Einheiten in allen Ampelstufen und eine mit fehlendem Datum', async () => {
    const stock = await testDb.db
      .select({ bestBefore: units.bestBefore })
      .from(units)
      .where(eq(units.status, 'vorrat'))
    const dates = new Set(stock.map((unit) => unit.bestBefore))

    for (const offset of Object.values(AMPEL_OFFSETS)) {
      expect(dates).toContain(daysFrom(TODAY, offset))
    }
    expect(dates).toContain(null)
  })

  it('enthält ein Produkt ohne Nährwerte und Erfassungen auf beiden Wegen', async () => {
    const withoutNutrition = await testDb.db
      .select({ name: products.name })
      .from(products)
      .where(isNull(products.nutritionSource))
    const methods = await testDb.db.selectDistinct({ method: captures.method }).from(captures)

    expect(withoutNutrition).toEqual([{ name: 'Walnüsse' }])
    expect(methods.map((row) => row.method).sort()).toEqual(['foto', 'manuell'])
  })

  it('enthält Historie mit einer verbrauchten und einer entsorgten Einheit', async () => {
    const history = await testDb.db.select({ status: units.status }).from(units)
    const statuses = history.map((unit) => unit.status)

    expect(statuses).toContain('verbraucht')
    expect(statuses).toContain('entsorgt')
  })

  it('legt keinen zweiten Haushalt an, wenn schon einer existiert', async () => {
    expect(await seedDemo(testDb.db, TODAY)).toBe(false)
    expect(await testDb.db.select().from(households)).toHaveLength(1)
  })
})

describe('daysFrom', () => {
  it('rechnet Tage vor und zurück über Monatsgrenzen', () => {
    expect(daysFrom(TODAY, 10)).toBe('2026-12-02')
    expect(daysFrom(TODAY, -22)).toBe('2026-10-31')
  })
})
