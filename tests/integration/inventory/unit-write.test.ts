import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { consumeUnit } from '../../../src/features/inventory/application/consume-unit'
import { returnToStock } from '../../../src/features/inventory/application/return-to-stock'
import type { StockReader } from '../../../src/features/inventory/application/stock-reader'
import { takeOne } from '../../../src/features/inventory/application/take-one'
import type { UnitWriter } from '../../../src/features/inventory/application/unit-writer'
import { createUnitWriteRepository } from '../../../src/features/inventory/data/unit-write-repository'
import { users } from '../../../src/server/db/schema/account'
import { products, units } from '../../../src/server/db/schema/inventory'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { setupStockRead } from './stock-read-fixtures'

const now = new Date('2026-11-22T10:00:00Z')

describe('Entnehmen und Rückgängig gegen die Datenbank (#46)', () => {
  let testDb: TestDb
  let reader: StockReader
  let writer: UnitWriter
  let householdId: string
  let foreignId: string
  let noodlesId: string
  let userId: string
  let otherUserId: string

  beforeAll(async () => {
    testDb = await createTestDb()
    ;({ reader, householdId, foreignId, noodlesId } = await setupStockRead(testDb.db))
    writer = createUnitWriteRepository(testDb.db)
    // Demo: Alex ist Admin, Sam Mitglied (db/seeds/demo-data.ts)
    const people = await testDb.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.householdId, householdId))
      .orderBy(users.username)
    userId = people[0]?.id ?? ''
    otherUserId = people[1]?.id ?? ''
  })

  afterAll(async () => {
    await testDb.close()
  })

  async function unitOf(unitId: string) {
    const [row] = await testDb.db.select().from(units).where(eq(units.id, unitId))
    return row
  }

  async function stockUnitOf(household: string) {
    const [row] = await testDb.db
      .select({ id: units.id })
      .from(units)
      .innerJoin(products, eq(products.id, units.productId))
      .where(eq(products.householdId, household))
      .limit(1)
    return row?.id ?? ''
  }

  it('nimmt mit „−1“ die Nudeln mit dem frühesten MHD und speichert Nutzer und Zeitpunkt', async () => {
    const target = { kind: 'food-type' as const, id: noodlesId }

    const result = await takeOne({ reader, writer }, { householdId, userId, target, now })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    // Demo: Nudeln grün, grün, gelb. Gelb läuft zuerst ab
    expect(result.value.bestBefore?.date).toBe('2027-01-21')
    const row = await unitOf(result.value.unitId)
    expect(row).toMatchObject({ status: 'verbraucht', takenBy: userId, takenAt: now })
  })

  it('ändert eine doppelt entnommene Packung nur einmal', async () => {
    const unitId = await stockUnitOf(householdId)
    await returnToStock(writer, { householdId, userId, unitId })

    const [first, second] = await Promise.all([
      consumeUnit(writer, { householdId, userId, unitId, now }),
      consumeUnit(writer, { householdId, userId, unitId, now }),
    ])

    expect([first.ok, second.ok].sort()).toEqual([false, true])
    expect([first, second].find((result) => !result.ok)).toEqual({
      ok: false,
      error: { kind: 'not-in-stock' },
    })
  })

  it('holt mit Rückgängig die Packung zurück und löscht Zeitpunkt und Nutzer', async () => {
    const unitId = await stockUnitOf(householdId)
    await consumeUnit(writer, { householdId, userId, unitId, now })

    expect((await returnToStock(writer, { householdId, userId, unitId })).ok).toBe(true)
    expect(await unitOf(unitId)).toMatchObject({ status: 'vorrat', takenAt: null, takenBy: null })
  })

  it('holt mit Rückgängig keine Entnahme eines anderen Nutzers zurück', async () => {
    const unitId = await stockUnitOf(householdId)
    await consumeUnit(writer, { householdId, userId, unitId, now })

    const result = await returnToStock(writer, { householdId, userId: otherUserId, unitId })

    expect(result).toEqual({ ok: false, error: { kind: 'not-found' } })
    expect(await unitOf(unitId)).toMatchObject({ status: 'verbraucht', takenBy: userId })
    await returnToStock(writer, { householdId, userId, unitId })
  })

  it('fasst eine Packung eines fremden Haushalts nicht an', async () => {
    const foreignUnit = await stockUnitOf(foreignId)

    const consumed = await consumeUnit(writer, { householdId, userId, unitId: foreignUnit, now })
    const returned = await returnToStock(writer, { householdId, userId, unitId: foreignUnit })

    expect(consumed).toEqual({ ok: false, error: { kind: 'not-found' } })
    expect(returned).toEqual({ ok: false, error: { kind: 'not-found' } })
    expect(await unitOf(foreignUnit)).toMatchObject({ status: 'vorrat', takenAt: null })
  })

  it('nimmt mit „−1“ aus einem fremden Haushalt nichts', async () => {
    const [foreignProduct] = await testDb.db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.householdId, foreignId))
    const target = { kind: 'product' as const, id: foreignProduct?.id ?? '' }

    const result = await takeOne({ reader, writer }, { householdId, userId, target, now })

    expect(result).toEqual({ ok: false, error: { kind: 'not-found' } })
  })
})
