import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { returnToStock } from '../../../src/features/inventory/application/return-to-stock'
import type { StockReader } from '../../../src/features/inventory/application/stock-reader'
import { takeOne } from '../../../src/features/inventory/application/take-one'
import { takeOutUnit } from '../../../src/features/inventory/application/take-out-unit'
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

  const consume = (unitId: string, outcome: 'consumed' | 'discarded' = 'consumed') =>
    takeOutUnit(writer, { householdId, userId, unitId, outcome, now })

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

    const [first, second] = await Promise.all([consume(unitId), consume(unitId)])

    expect([first.ok, second.ok].sort()).toEqual([false, true])
    expect([first, second].find((result) => !result.ok)).toEqual({
      ok: false,
      error: { kind: 'not-in-stock' },
    })
  })

  it('holt mit Rückgängig die Packung zurück und löscht Zeitpunkt und Nutzer', async () => {
    const unitId = await stockUnitOf(householdId)
    await consume(unitId)

    expect((await returnToStock(writer, { householdId, userId, unitId })).ok).toBe(true)
    expect(await unitOf(unitId)).toMatchObject({ status: 'vorrat', takenAt: null, takenBy: null })
  })

  it('holt mit Rückgängig keine Entnahme eines anderen Nutzers zurück', async () => {
    const unitId = await stockUnitOf(householdId)
    await consume(unitId)

    const result = await returnToStock(writer, { householdId, userId: otherUserId, unitId })

    expect(result).toEqual({ ok: false, error: { kind: 'not-found' } })
    expect(await unitOf(unitId)).toMatchObject({ status: 'verbraucht', takenBy: userId })
    await returnToStock(writer, { householdId, userId, unitId })
  })

  it('setzt bei „Entsorgt“ Status, Zeitpunkt und Nutzer, Rückgängig holt die Packung zurück', async () => {
    const unitId = await stockUnitOf(householdId)
    await returnToStock(writer, { householdId, userId, unitId })

    expect((await consume(unitId, 'discarded')).ok).toBe(true)
    expect(await unitOf(unitId)).toMatchObject({
      status: 'entsorgt',
      takenBy: userId,
      takenAt: now,
    })

    expect(await returnToStock(writer, { householdId, userId: otherUserId, unitId })).toEqual({
      ok: false,
      error: { kind: 'not-found' },
    })
    expect((await returnToStock(writer, { householdId, userId, unitId })).ok).toBe(true)
    expect(await unitOf(unitId)).toMatchObject({ status: 'vorrat', takenAt: null, takenBy: null })
  })

  it('fasst eine Packung eines fremden Haushalts nicht an', async () => {
    const foreignUnit = await stockUnitOf(foreignId)

    const consumed = await consume(foreignUnit)
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
