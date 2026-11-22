import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getDueUnits } from '../../../src/features/inventory/application/get-due-units'
import { getFoodTypeDetail } from '../../../src/features/inventory/application/get-food-type-detail'
import { getFoodTypeLevel } from '../../../src/features/inventory/application/get-food-type-level'
import { getStockOverview } from '../../../src/features/inventory/application/get-stock-overview'
import { searchStock } from '../../../src/features/inventory/application/search-stock'
import type { StockReader } from '../../../src/features/inventory/application/stock-reader'
import { stockFilterSchema } from '../../../src/features/inventory/schemas'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { insertForeignMasterData, SECRET } from './foreign-master-data'
import { setupStockRead, today } from './stock-read-fixtures'

const STATUSES = ['in-stock', 'due-soon', 'expired', 'incomplete', 'consumed', 'discarded']

describe('Mandantentrennung mit fremden eigenen Stammdaten (#133)', () => {
  let testDb: TestDb
  let reader: StockReader
  let householdId: string
  let foreignId: string
  let own: Awaited<ReturnType<typeof insertForeignMasterData>>

  beforeAll(async () => {
    testDb = await createTestDb()
    ;({ reader, householdId, foreignId } = await setupStockRead(testDb.db))
    own = await insertForeignMasterData(testDb.db, { householdId, foreignId })
  })

  afterAll(async () => {
    await testDb.close()
  })

  const search = (filter: Record<string, string>, household = householdId) =>
    searchStock(reader, { householdId: household, today, filter: stockFilterSchema.parse(filter) })

  async function everyDemoOutput(): Promise<unknown[]> {
    const outputs: unknown[] = [
      await getStockOverview(reader, { householdId, today }),
      await getFoodTypeLevel(reader, { householdId, today, groupKey: 'getreide' }),
      await getDueUnits(reader, { householdId, today, sort: 'location' }),
      await search({ search: SECRET.toLowerCase() }),
      await search({ categoryId: own.categoryId }),
      await search({ storageLocationId: own.storageLocationId }),
    ]
    for (const status of STATUSES) outputs.push(await search({ status }))
    return outputs
  }

  it('zeigt im eigenen Haushalt keinen fremden Namen, auch bei kaputten Bezügen', async () => {
    const outputs = await everyDemoOutput()

    for (const output of outputs) expect(JSON.stringify(output)).not.toContain(SECRET)
  })

  it('liefert für die fremde Lebensmittelart not-found', async () => {
    const target = { kind: 'food-type', id: own.foodTypeId } as const
    const detail = await getFoodTypeDetail(reader, { householdId, today, target })

    expect(detail).toEqual({ ok: false, error: { kind: 'not-found' } })
  })

  it('zeigt das Produkt mit fremdem Lagerort ohne Lagerort', async () => {
    const result = await search({ search: 'Kaputt 2' })
    const due = await getDueUnits(reader, { householdId, today, sort: 'date' })
    const entry = due.groups
      .flatMap((group) => group.entries)
      .find((candidate) => candidate.productNames.includes('Kaputt 2'))

    expect(result.counts['in-stock']).toBe(1)
    expect(entry?.storageLocations).toEqual([])
  })

  it('zeigt dem fremden Haushalt seine eigenen Stammdaten', async () => {
    const result = await search({ search: SECRET.toLowerCase() }, foreignId)

    expect(result.groups.flatMap((group) => group.rows.map((row) => row.name))).toEqual([
      `${SECRET}art`,
    ])
    expect(result.options.storageLocations.map((location) => location.name)).toEqual([
      `${SECRET}keller`,
    ])
  })
})
