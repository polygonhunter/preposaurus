import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  buildCapture,
  buildHousehold,
  buildMember,
  buildProduct,
  buildUnit,
} from '../../../db/seeds/factories'
import { seedMasterData } from '../../../db/seeds/master-data'
import { setupFirstAdmin } from '../../../src/features/auth/application/setup-first-admin'
import { createFirstAdminRepository } from '../../../src/features/auth/data/first-admin-repository'
import { createStockReadRepository } from '../../../src/features/inventory/data/stock-read-repository'
import { getOverview } from '../../../src/features/supply/application/get-overview'
import { countOpenRestockItems } from '../../../src/features/restock/application/count-open-items'
import { createRestockRepository } from '../../../src/features/restock/data/restock-repository'
import { createHouseholdFactsRepository } from '../../../src/features/supply/data/household-facts-repository'
import { overviewSchema } from '../../../src/features/supply/schemas'
import { users } from '../../../src/server/db/schema/account'
import { categories } from '../../../src/server/db/schema/catalog'
import { captures } from '../../../src/server/db/schema/confirmed-captures'
import { households, members } from '../../../src/server/db/schema/household'
import { products, units } from '../../../src/server/db/schema/inventory'
import {
  productGroups,
  sourceNeeds,
  sources,
  sourceValues,
  sourceVersions,
} from '../../../src/server/db/schema/recommendation'
import { toCalendarDay } from '../../../src/shared/lib/dates'
import { createTestDb, type TestDb } from '../../helpers/test-db'

// Empfehlungsquelle BBK/BLE aus dem regulären Seed (#20) und eine frische Einrichtung, die damit
// sofort Tage zeigt (#206). Die Erwartungen sind die Zahlen aus docs/quellen/EMPFEHLUNGSWERTE.md.
const today = toCalendarDay('2026-11-23')
const FAR_DATE = '2030-01-31'

// Prüfblatt §1.2: Mischkost für 1 Person und 10 Tage, in g bzw. ml
const TEN_DAYS_MIXED = {
  getreide: 3300,
  gemuese_huelsenfruechte: 4000,
  obst_nuesse: 2500,
  milch: 2500,
  fleisch_fisch_eier: 1200,
  fette_oele: 330,
  wasser: 20_000,
}

describe('Empfehlungsquelle BBK/BLE im Seed', () => {
  let testDb: TestDb

  beforeAll(async () => {
    testDb = await createTestDb()
    await seedMasterData(testDb.db)
  })

  afterAll(async () => {
    await testDb.close()
  })

  const versions = () =>
    testDb.db
      .select({
        id: sourceVersions.id,
        name: sources.name,
        asOf: sourceVersions.asOf,
        link: sourceVersions.link,
        defaultDays: sourceVersions.defaultDays,
        isVerified: sourceVersions.isVerified,
      })
      .from(sourceVersions)
      .innerJoin(sources, eq(sources.id, sourceVersions.sourceId))
      .where(eq(sources.key, 'bbk-ble'))

  it('legt genau eine Fassung an, ungeprüft, mit Stand, Link und 10 Tagen, auch nach erneutem Seed', async () => {
    await seedMasterData(testDb.db)

    const found = await versions()
    expect(found).toHaveLength(1)
    expect(found[0]).toMatchObject({
      name: 'BBK/BLE',
      asOf: 'BBK 11/2025, BLE 2024',
      link: 'https://www.ernaehrungsvorsorge.de/private-vorsorge/notvorrat/vorratstabelle',
      defaultDays: 10,
      isVerified: false,
    })
  })

  it('Mengen je Warengruppe ergeben × 10 Tage die Summen des Prüfblatts', async () => {
    const [version] = await versions()
    const rows = await testDb.db
      .select({
        key: productGroups.key,
        diet: sourceValues.diet,
        amount: sourceValues.amountPerPersonDay,
      })
      .from(sourceValues)
      .innerJoin(productGroups, eq(productGroups.id, sourceValues.productGroupId))
      .where(eq(sourceValues.sourceVersionId, version?.id ?? ''))
    const tenDays = (diet: string) =>
      Object.fromEntries(
        rows.filter((row) => row.diet === diet).map((row) => [row.key, Number(row.amount) * 10]),
      )

    expect(tenDays('alles')).toEqual(TEN_DAYS_MIXED)
    expect(tenDays('vegetarisch')).toEqual({ ...TEN_DAYS_MIXED, fleisch_fisch_eier: 1300 })
    expect(rows.some((row) => row.diet === 'vegan')).toBe(false)
  })

  it('Bedarf je Person: 2.200 kcal, Wasser nach Prüfblatt §2.2, kein Wert für Babys', async () => {
    const [version] = await versions()
    const needs = await testDb.db
      .select({
        group: sourceNeeds.personGroup,
        kcal: sourceNeeds.kcalPerDay,
        water: sourceNeeds.waterMlPerDay,
      })
      .from(sourceNeeds)
      .where(eq(sourceNeeds.sourceVersionId, version?.id ?? ''))

    expect(
      Object.fromEntries(needs.map((need) => [need.group, [Number(need.kcal), need.water]])),
    ).toEqual({
      kind: [2200, 1500],
      jugendlich: [2200, 2000],
      erwachsen: [2200, 2000],
      senior: [2200, 2500],
    })
  })

  it('gibt Haushalten ohne Quelle die Fassung, eine gewählte Quelle bleibt', async () => {
    const [version] = await versions()
    const without = buildHousehold({ name: 'Ohne Quelle' })
    await testDb.db.insert(households).values(without)

    await seedMasterData(testDb.db)

    const [row] = await testDb.db
      .select({ source: households.activeSourceVersionId })
      .from(households)
      .where(eq(households.id, without.id))
    expect(row?.source).toBe(version?.id)
    await testDb.db.delete(households).where(eq(households.id, without.id))
  })

  it('frische Einrichtung bekommt die Quelle und die Übersicht zeigt Tage', async () => {
    const repository = createFirstAdminRepository(testDb.db)
    const hashPassword = () => Promise.resolve('salz:hash')
    const input = { displayName: 'Kim', username: 'kim', password: 'Hafer Linse Regal Wolke' }
    expect((await setupFirstAdmin({ repository, hashPassword }, input)).ok).toBe(true)

    const [admin] = await testDb.db.select().from(users)
    const householdId = admin?.householdId ?? ''
    await testDb.db
      .insert(members)
      .values([
        buildMember({ householdId, name: 'Kim', type: 'erwachsen' }),
        buildMember({ householdId, name: 'Sam', type: 'erwachsen' }),
        buildMember({ householdId, name: 'Pia', type: 'kind' }),
      ])
    const capture = buildCapture({ householdId, userId: admin?.id ?? '' })
    const { db } = testDb
    const categoryId = async (key: string) =>
      (await db.select().from(categories).where(eq(categories.key, key)))[0]?.id ?? ''
    const water = buildProduct({
      householdId,
      categoryId: await categoryId('wasser'),
      name: 'Stilles Wasser',
      contentAmount: '1000',
      contentUnit: 'ml',
      kcalPer100: '0',
    })
    // TESTDATEN: 10 × 500 g Nudeln mit 359 kcal je 100 g = 17.950 kcal
    const noodles = buildProduct({ householdId, categoryId: await categoryId('getreide') })
    await db.insert(products).values([water, noodles])
    await db.insert(captures).values(capture)
    const unitsOf = (productId: string, count: number) =>
      Array.from({ length: count }, () =>
        buildUnit({ productId, captureId: capture.id, bestBefore: FAR_DATE }),
      )
    await db.insert(units).values([...unitsOf(water.id, 18), ...unitsOf(noodles.id, 10)])

    const ports = {
      stock: createStockReadRepository(db),
      facts: createHouseholdFactsRepository(db),
      countOpenRestockItems: (id: string) => countOpenRestockItems(createRestockRepository(db), id),
    }
    const overview = overviewSchema.parse(await getOverview(ports, { householdId, today }))

    // Bedarf: 3 × 2.200 = 6.600 kcal, 2 + 2 + 1,5 = 5,5 l Wasser je Tag
    expect(overview.household.source).toMatchObject({ name: 'BBK/BLE', isVerified: false })
    expect(overview.supply).toMatchObject({
      energyDays: 2.7,
      waterDays: 3.2,
      days: 2.7,
      bottleneck: 'energy',
    })
    expect(overview.nextStep).toEqual({
      resource: 'energy',
      missing: 66_000 - 17_950,
      alsoMissing: { resource: 'water', missing: 55_000 - 18_000 },
    })
  })
})
