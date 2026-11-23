import { asc, eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getFoodTypeHistory } from '../../../src/features/inventory/application/get-food-type-history'
import { markStillGood } from '../../../src/features/inventory/application/mark-still-good'
import { takeOutUnit } from '../../../src/features/inventory/application/take-out-unit'
import { createStockReadRepository } from '../../../src/features/inventory/data/stock-read-repository'
import { createUnitWriteRepository } from '../../../src/features/inventory/data/unit-write-repository'
import { historyEntrySchema } from '../../../src/features/inventory/schemas/detail'
import { users } from '../../../src/server/db/schema/account'
import { products, units } from '../../../src/server/db/schema/inventory'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { setupStockRead, today } from './stock-read-fixtures'

describe('Verlauf einer Lebensmittelart gegen die Datenbank (#48)', () => {
  let testDb: TestDb
  let householdId: string
  let foreignId: string
  let walnutProductId: string

  beforeAll(async () => {
    testDb = await createTestDb()
    ;({ householdId, foreignId } = await setupStockRead(testDb.db))
    const [walnuts] = await testDb.db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.name, 'Walnüsse'))
    walnutProductId = walnuts?.id ?? ''
  })

  afterAll(async () => {
    await testDb.close()
  })

  const history = (household = householdId) => {
    const reader = createStockReadRepository(testDb.db)
    const target = { kind: 'product' as const, id: walnutProductId }
    return getFoodTypeHistory({ reader, history: reader }, { householdId: household, target })
  }

  it('ist leer, solange nichts entnommen oder geprüft ist', async () => {
    expect(await history()).toEqual([])
  })

  it('nennt „Noch gut“ und „Entsorgt“ mit Tag und Person, neueste zuerst', async () => {
    const writer = createUnitWriteRepository(testDb.db)
    const [unit] = await testDb.db
      .select({ id: units.id })
      .from(units)
      .where(eq(units.productId, walnutProductId))
    const [alex] = await testDb.db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.householdId, householdId))
      .orderBy(asc(users.username))
    const unitId = unit?.id ?? ''
    await markStillGood(writer, { householdId, unitIds: [unitId], today })
    const now = new Date('2026-11-23T09:00:00Z')
    await takeOutUnit(writer, {
      householdId,
      userId: alex?.id ?? '',
      unitId,
      outcome: 'discarded',
      now,
    })

    const entries = historyEntrySchema.array().parse(await history())

    expect(entries.map((entry) => [entry.kind, entry.day, entry.person])).toEqual([
      ['discarded', '2026-11-23', alex?.name],
      ['still-good', '2026-11-22', null],
    ])
  })

  it('zeigt einem fremden Haushalt nichts davon', async () => {
    expect(await history(foreignId)).toEqual([])
  })
})
