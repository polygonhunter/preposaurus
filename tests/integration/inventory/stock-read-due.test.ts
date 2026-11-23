import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getDueUnits } from '../../../src/features/inventory/application/get-due-units'
import { getStockOverview } from '../../../src/features/inventory/application/get-stock-overview'
import type { StockReader } from '../../../src/features/inventory/application/stock-reader'
import { dueUnitsSchema } from '../../../src/features/inventory/schemas/due'
import { householdSettings } from '../../../src/server/db/schema/household'
import { products, units } from '../../../src/server/db/schema/inventory'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { setupStockRead, today } from './stock-read-fixtures'

describe('Bald fällig und „Noch gut“ gegen die Datenbank', () => {
  let testDb: TestDb
  let reader: StockReader
  let householdId: string
  let foreignId: string

  beforeAll(async () => {
    testDb = await createTestDb()
    ;({ reader, householdId, foreignId } = await setupStockRead(testDb.db))
  })

  afterAll(async () => {
    await testDb.close()
  })

  const namesIn = async (group: string, household = householdId) => {
    const due = dueUnitsSchema.parse(
      await getDueUnits(reader, { householdId: household, today, sort: 'date' }),
    )
    const entries = due.groups.find((entry) => entry.group === group)?.entries ?? []
    // Gleiches Datum: Die Reihenfolge folgt der zufälligen ID, deshalb nach Name sortiert
    return entries
      .map((entry) => [entry.name, entry.unitIds.length] as const)
      .sort(([a], [b]) => a.localeCompare(b, 'de'))
  }

  const fishPackages = async () => {
    const overview = await getStockOverview(reader, { householdId, today })
    return overview.groups.find((group) => group.key === 'fleisch_fisch_eier')?.totals
  }

  it('ordnet die Demo-Packungen den Zeitgruppen zu, „Datum fehlt“ in keine', async () => {
    const due = await getDueUnits(reader, { householdId, today, sort: 'date' })

    expect(due.counts).toEqual({
      expired: 2,
      'this-week': 0,
      'this-month': 2,
      'next-three-months': 3,
    })
    expect(
      due.groups.flatMap((group) => group.entries).every((entry) => entry.bestBefore !== null),
    ).toBe(true)
    expect(await namesIn('this-month')).toEqual([
      ['H-Milch', 1],
      ['Haferflocken', 1],
    ])
  })

  it('liefert einem fremden Haushalt nur seine eigenen fälligen Packungen', async () => {
    expect(await namesIn('this-week', foreignId)).toEqual([['Nudeln', 1]])
    expect(await namesIn('expired', foreignId)).toEqual([])
  })

  it('nimmt „Noch gut“ aus „Abgelaufen“ und zählt es nur mit dem Schalter mit', async () => {
    const [tuna] = await testDb.db
      .select({ id: units.id })
      .from(units)
      .innerJoin(products, eq(products.id, units.productId))
      .where(eq(products.name, 'Thunfisch in Öl'))
      .orderBy(units.bestBefore)
      .limit(1)
    if (tuna === undefined) throw new Error('Thunfisch fehlt')
    await testDb.db.update(units).set({ checkedAt: today }).where(eq(units.id, tuna.id))

    expect(await namesIn('expired')).toEqual([['Walnüsse', 1]])
    expect(await fishPackages()).toMatchObject({ packages: 1, uncountedPackages: 1 })

    await testDb.db
      .update(householdSettings)
      .set({ stillGoodCountsAsSupplied: true })
      .where(eq(householdSettings.householdId, householdId))

    expect(await fishPackages()).toMatchObject({ packages: 2, uncountedPackages: 0, kcal: 570 })
  })
})
