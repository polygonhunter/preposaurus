import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { seedDemoSource } from '../../../db/seeds/demo-source'
import { createStockWithSupply } from '../../../src/features/capture/application/create-stock-with-supply'
import { createStockWriteRepository } from '../../../src/features/capture/data/stock-write-repository'
import { createStockSchema } from '../../../src/features/capture/schemas/stock'
import type { StockReader } from '../../../src/features/inventory/application/stock-reader'
import { getSupplyDaysNow } from '../../../src/features/supply/application/supply-days-now'
import { users } from '../../../src/server/db/schema/account'
import { foodTypes } from '../../../src/server/db/schema/food-types'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { setupStockRead, today } from '../inventory/stock-read-fixtures'

// Satz nach dem Speichern (#231) gegen PGlite: Beispielhaushalt mit 3 Personen und Beispielquelle,
// vor und nach dem Speichern dieselbe Rechnung wie der Kopf der Übersicht.
describe('Tage vor und nach dem Speichern', () => {
  let testDb: TestDb
  let reader: StockReader
  let householdId: string
  let userId: string

  beforeAll(async () => {
    testDb = await createTestDb()
    const setup = await setupStockRead(testDb.db)
    ;({ reader, householdId } = setup)
    await seedDemoSource(testDb.db, householdId)
    const [user] = await testDb.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.householdId, householdId))
    if (user === undefined) throw new Error('Nutzer des Beispielhaushalts fehlt')
    userId = user.id
  })

  afterAll(async () => {
    await testDb.close()
  })

  async function foodTypeId(key: string) {
    const [row] = await testDb.db
      .select({ id: foodTypes.id })
      .from(foodTypes)
      .where(eq(foodTypes.key, key))
    if (row === undefined) throw new Error(`${key} fehlt`)
    return row.id
  }

  async function save(key: string, content: { value: number; unit: 'g' | 'ml' }, count: number) {
    const draft = createStockSchema.parse({
      captureId: randomUUID(),
      method: 'manual',
      product: { kind: 'new', foodTypeId: await foodTypeId(key), name: null, content },
      units: [{ bestBefore: { date: '2028-06-01', precision: 'month' }, count }],
    })
    const deps = {
      writer: createStockWriteRepository(testDb.db),
      now: () => new Date('2026-11-22T10:00:00Z'),
      readSupplyDays: (id: string) => getSupplyDaysNow(reader, { householdId: id, today }),
    }
    return createStockWithSupply(deps, { householdId, userId, draft })
  }

  it('nennt nach 10 Packungen Nudeln mehr Essen-Tage', async () => {
    const before = await getSupplyDaysNow(reader, { householdId, today })

    const result = await save('nudeln', { value: 500, unit: 'g' }, 10)

    const after = await getSupplyDaysNow(reader, { householdId, today })
    expect(result.ok && result.value.supplyChange).toEqual({
      resource: 'energy',
      before: before?.energyDays,
      after: after?.energyDays,
    })
    expect(Math.floor(after?.energyDays ?? 0)).toBeGreaterThan(Math.floor(before?.energyDays ?? 0))
  })

  it('nennt nach 12 Flaschen Wasser mehr Wasser-Tage', async () => {
    const before = await getSupplyDaysNow(reader, { householdId, today })

    const result = await save('sprudelwasser', { value: 1500, unit: 'ml' }, 12)

    expect(result.ok && result.value.supplyChange).toMatchObject({
      resource: 'water',
      before: before?.waterDays,
    })
  })

  it('bleibt still, wenn eine kleine Packung die ganzen Tage nicht ändert', async () => {
    const result = await save('nudeln', { value: 10, unit: 'g' }, 1)

    expect(result.ok && result.value.supplyChange).toBeNull()
  })
})
