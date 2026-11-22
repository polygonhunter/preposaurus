// Laufzeit der Lesepfade gegen die Datenbank mit großem Haushalt (#141): 5000 Produkte, 30.000
// Packungen. Lokal mit PGlite allein liegen alle Pfade bei etwa 50 bis 450 ms, den Großteil kostet
// die Übergabe der 30.000 Zeilen aus PGlite (WASM). In der vollen Suite mit Coverage und parallelen
// Dateien wird es bis zu dreimal langsamer, deshalb ist die Grenze großzügig. Den Rückfall auf
// „Zeilen × Packungen“ fängt read-performance.test.ts ohne Datenbank genauer ab. Gemessen wird der
// schnellste von drei Läufen, damit eine kurze Lastspitze den Test nicht kippt.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getDueUnits } from '../../../src/features/inventory/application/get-due-units'
import { getFoodTypeLevel } from '../../../src/features/inventory/application/get-food-type-level'
import { getStockOverview } from '../../../src/features/inventory/application/get-stock-overview'
import { searchStock } from '../../../src/features/inventory/application/search-stock'
import type { StockReader } from '../../../src/features/inventory/application/stock-reader'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { fillLargeHousehold } from './large-household'
import { setupStockRead, today } from './stock-read-fixtures'

const PRODUCTS = 5000
const UNITS_PER_PRODUCT = 6
const LIMIT_MS = 3000
const RUNS = 3

async function fastestRun(run: () => Promise<unknown>): Promise<number> {
  await run() // Aufwärmen: Abfragepläne und JIT
  let fastest = Number.POSITIVE_INFINITY
  for (let attempt = 0; attempt < RUNS; attempt += 1) {
    const start = performance.now()
    await run()
    fastest = Math.min(fastest, performance.now() - start)
  }
  return fastest
}

describe('Lesepfade mit großem Haushalt', () => {
  let testDb: TestDb
  let reader: StockReader
  let householdId: string

  beforeAll(async () => {
    testDb = await createTestDb()
    ;({ reader, householdId } = await setupStockRead(testDb.db))
    await fillLargeHousehold(testDb.db, {
      householdId,
      products: PRODUCTS,
      unitsPerProduct: UNITS_PER_PRODUCT,
    })
  }, 120_000)

  afterAll(async () => {
    await testDb.close()
  })

  const filter = { status: 'in-stock' } as const

  it.each([
    ['Ebene 1', () => getStockOverview(reader, { householdId, today })],
    ['Ebene 2', () => getFoodTypeLevel(reader, { householdId, today, groupKey: 'getreide' })],
    ['Suche', () => searchStock(reader, { householdId, today, filter })],
    ['Bald fällig', () => getDueUnits(reader, { householdId, today, sort: 'date' })],
  ])('%s bleibt unter der Grenze', async (_name, run) => {
    expect(await fastestRun(run)).toBeLessThan(LIMIT_MS)
  })
})
