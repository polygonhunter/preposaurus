import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { DEMO_SOURCE, seedDemoSource } from '../../../db/seeds/demo-source'
import {
  getOverview,
  type OverviewPorts,
} from '../../../src/features/supply/application/get-overview'
import { countOpenRestockItems } from '../../../src/features/restock/application/count-open-items'
import { createRestockRepository } from '../../../src/features/restock/data/restock-repository'
import { createHouseholdFactsRepository } from '../../../src/features/supply/data/household-facts-repository'
import { overviewSchema } from '../../../src/features/supply/schemas'
import { households } from '../../../src/server/db/schema/household'
import { goals } from '../../../src/server/db/schema/recommendation'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { setupStockRead, today } from '../inventory/stock-read-fixtures'

// Übersicht gegen PGlite mit dem Beispielhaushalt (db/seeds/demo.ts, Stichtag 22.11.2026) und der
// erfundenen Beispielquelle. Ein zweiter, fremder Haushalt darf nirgends auftauchen (#133).
describe('Übersicht gegen die Datenbank', () => {
  let testDb: TestDb
  let ports: OverviewPorts
  let householdId: string
  let foreignId: string

  beforeAll(async () => {
    testDb = await createTestDb()
    const setup = await setupStockRead(testDb.db)
    ;({ householdId, foreignId } = setup)
    await seedDemoSource(testDb.db, householdId)
    const restock = createRestockRepository(testDb.db)
    ports = {
      stock: setup.reader,
      facts: createHouseholdFactsRepository(testDb.db),
      countOpenRestockItems: (id) => countOpenRestockItems(restock, id),
    }
  })

  afterAll(async () => {
    await testDb.close()
  })

  const load = async (household = householdId) =>
    overviewSchema.parse(await getOverview(ports, { householdId: household, today }))

  it('rechnet „Heute versorgt“ mit Bedarf aus Mitgliedern und aktiver Quelle', async () => {
    const overview = await load()

    expect(overview.hasStock).toBe(true)
    expect(overview.supply).not.toBeNull()
    expect(overview.supply?.days).toBe(
      Math.min(overview.supply?.energyDays ?? 0, overview.supply?.waterDays ?? 0),
    )
    expect(overview.household).toEqual({
      members: 3,
      source: {
        name: DEMO_SOURCE.name,
        asOf: DEMO_SOURCE.asOf,
        link: DEMO_SOURCE.link,
        isVerified: false,
      },
    })
  })

  it('liest Ziel mit Datum und nennt den Stand dort', async () => {
    const { goal, nextStep } = await load()

    expect(goal).toMatchObject({ days: 10, date: '2027-01-01', outlook: { kind: 'valid' } })
    expect(nextStep?.missing).toBeGreaterThan(0)
  })

  it('zählt Bald fällig je Zeitgruppe und zeigt die ersten drei Einträge', async () => {
    const { due } = await load()

    expect(due.counts).toEqual({
      expired: 2,
      'this-week': 0,
      'this-month': 2,
      'next-three-months': 3,
    })
    expect(due.total).toBe(7)
    expect(due.entries).toHaveLength(3)
    expect(due.entries.map((entry) => entry.group)).toEqual(['expired', 'expired', 'this-month'])
  })

  it('zeigt Warengruppen ohne Wasser, genau eine als knappste, und den Nachkauf-Hinweis', async () => {
    const { groups, restock } = await load()

    expect(groups.map((group) => group.key)).not.toContain('wasser')
    expect(groups.filter((group) => group.isTightest)).toHaveLength(1)
    expect(restock.openItems).toBe(1)
    expect(restock.gapGroups).toBeGreaterThan(0)
  })

  it('ohne Zieldatum entfällt der Stand am Zieldatum', async () => {
    await testDb.db
      .update(goals)
      .set({ targetDate: null })
      .where(eq(goals.householdId, householdId))

    const { goal } = await load()

    expect(goal).toEqual({ days: 10, date: null, outlook: null })
  })

  it('ohne aktive Quelle gibt es keine Tage, Bald fällig bleibt', async () => {
    await testDb.db
      .update(households)
      .set({ activeSourceVersionId: null })
      .where(eq(households.id, householdId))

    const overview = await load()

    expect(overview.supply).toBeNull()
    expect(overview.groups).toEqual([])
    expect(overview.household.source).toBeNull()
    expect(overview.due.total).toBe(7)
  })

  it('zeigt einem fremden Haushalt nichts aus dem Beispielhaushalt', async () => {
    const overview = await load(foreignId)

    expect(overview.household).toEqual({ members: 0, source: null })
    expect(overview.goal).toBeNull()
    expect(overview.restock.openItems).toBe(0)
    expect(overview.due.entries.map((entry) => entry.name)).toEqual(['Nudeln'])
  })
})
