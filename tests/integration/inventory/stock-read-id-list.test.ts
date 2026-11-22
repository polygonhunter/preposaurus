// Lange ID-Listen im Lese-Repository (#141): node-postgres erlaubt höchstens 65.535 Parameter.
// Die IDs gehen deshalb als ein Array-Parameter an die Datenbank, nie als IN-Liste.
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { StockReader } from '../../../src/features/inventory/application/stock-reader'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { setupStockRead } from './stock-read-fixtures'

const PARAMETER_LIMIT = 65_535

describe('Lese-Repository mit mehr IDs als Parametern', () => {
  let testDb: TestDb
  let reader: StockReader
  let householdId: string
  let foreignId: string
  let ownIds: string[]
  let manyIds: string[]

  beforeAll(async () => {
    testDb = await createTestDb()
    ;({ reader, householdId, foreignId } = await setupStockRead(testDb.db))
    ownIds = (await reader.loadProducts(householdId, {})).map((product) => product.id)
    const unknownIds = Array.from({ length: PARAMETER_LIMIT + 1 }, () => randomUUID())
    manyIds = [...unknownIds, ...ownIds]
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('lädt Produkte zu einer langen ID-Liste', async () => {
    const products = await reader.loadProducts(householdId, { productIds: manyIds })

    expect(products.map((product) => product.id).sort()).toEqual([...ownIds].sort())
  })

  it('lädt und zählt Einheiten zu einer langen ID-Liste wie zu den eigenen IDs', async () => {
    const query = { statuses: ['stock', 'consumed', 'discarded'] } as const
    const many = await reader.loadUnits(householdId, { ...query, productIds: manyIds })
    const own = await reader.loadUnits(householdId, { ...query, productIds: ownIds })

    expect(many).toEqual(own)
    expect(many.length).toBeGreaterThan(0)
    expect(await reader.countUnitsByStatus(householdId, manyIds)).toEqual(
      await reader.countUnitsByStatus(householdId, ownIds),
    )
  })

  it('liefert für eine leere Liste nichts, ohne die Datenbank zu fragen', async () => {
    expect(await reader.loadProducts(householdId, { productIds: [] })).toEqual([])
    expect(await reader.loadUnits(householdId, { productIds: [], statuses: ['stock'] })).toEqual([])
  })

  it('gibt fremden Haushalten auch über die ID-Liste nichts heraus', async () => {
    expect(await reader.loadProducts(foreignId, { productIds: ownIds })).toEqual([])
    expect(await reader.loadUnits(foreignId, { productIds: ownIds, statuses: ['stock'] })).toEqual(
      [],
    )
  })
})
