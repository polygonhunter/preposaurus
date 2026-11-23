import { asc, eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getDueUnits } from '../../../src/features/inventory/application/get-due-units'
import { getStockOverview } from '../../../src/features/inventory/application/get-stock-overview'
import {
  markStillGood,
  undoStillGood,
} from '../../../src/features/inventory/application/mark-still-good'
import type { StockReader } from '../../../src/features/inventory/application/stock-reader'
import type { UnitWriter } from '../../../src/features/inventory/application/unit-writer'
import { createUnitWriteRepository } from '../../../src/features/inventory/data/unit-write-repository'
import { householdSettings } from '../../../src/server/db/schema/household'
import { products, units } from '../../../src/server/db/schema/inventory'
import { toCalendarDay } from '../../../src/shared/lib/dates'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { setupStockRead, today } from './stock-read-fixtures'

describe('„Noch gut“ gegen die Datenbank (#47)', () => {
  let testDb: TestDb
  let reader: StockReader
  let writer: UnitWriter
  let householdId: string
  let foreignId: string

  beforeAll(async () => {
    testDb = await createTestDb()
    ;({ reader, householdId, foreignId } = await setupStockRead(testDb.db))
    writer = createUnitWriteRepository(testDb.db)
  })

  afterAll(async () => {
    await testDb.close()
  })

  // Demo: Thunfisch rot (abgelaufen) und grün, Walnüsse rot (db/seeds/demo-data.ts)
  async function unitsOf(productName: string) {
    return testDb.db
      .select({ id: units.id, checkedAt: units.checkedAt })
      .from(units)
      .innerJoin(products, eq(products.id, units.productId))
      .where(eq(products.name, productName))
      .orderBy(asc(units.bestBefore))
  }

  const firstIdOf = async (productName: string) => (await unitsOf(productName))[0]?.id ?? ''

  const fishTotals = async () => {
    const overview = await getStockOverview(reader, { householdId, today })
    return overview.groups.find((group) => group.key === 'fleisch_fisch_eier')?.totals
  }

  const setStillGoodCounts = (isOn: boolean) =>
    testDb.db
      .update(householdSettings)
      .set({ stillGoodCountsAsSupplied: isOn })
      .where(eq(householdSettings.householdId, householdId))

  it('nimmt die Packung aus „Abgelaufen“ und zählt sie nur mit dem Schalter mit', async () => {
    const tuna = await firstIdOf('Thunfisch in Öl')

    const result = await markStillGood(writer, { householdId, unitIds: [tuna], today })

    expect(result).toEqual({ ok: true, value: { unitIds: [tuna], checkedAt: today } })
    const due = await getDueUnits(reader, { householdId, today, sort: 'date' })
    expect(due.counts.expired).toBe(1)
    expect(await fishTotals()).toMatchObject({ packages: 1, uncountedPackages: 1 })

    await setStillGoodCounts(true)
    expect(await fishTotals()).toMatchObject({ packages: 2, uncountedPackages: 0 })

    await setStillGoodCounts(false)
    await undoStillGood(writer, { householdId, unitIds: [tuna], checkedAt: today })
    expect((await unitsOf('Thunfisch in Öl'))[0]?.checkedAt).toBeNull()
  })

  it('prüft keine Packung mit Verbrauchsdatum und keine, die noch nicht abgelaufen ist', async () => {
    const [expired, fresh] = await unitsOf('Thunfisch in Öl')
    const nuts = await firstIdOf('Walnüsse')
    await testDb.db
      .update(units)
      .set({ bestBeforeKind: 'verbrauchen_bis' })
      .where(eq(units.id, nuts))

    const useBy = await markStillGood(writer, { householdId, unitIds: [nuts], today })
    const notExpired = await markStillGood(writer, {
      householdId,
      unitIds: [fresh?.id ?? ''],
      today,
    })

    expect(useBy).toEqual({ ok: false, error: { kind: 'not-applicable' } })
    expect(notExpired).toEqual({ ok: false, error: { kind: 'not-applicable' } })
    expect((await unitsOf('Walnüsse'))[0]?.checkedAt).toBeNull()
    expect(expired?.checkedAt).toBeNull()
    await testDb.db.update(units).set({ bestBeforeKind: 'mhd' }).where(eq(units.id, nuts))
  })

  it('fasst Packungen eines fremden Haushalts nicht an', async () => {
    const nuts = await firstIdOf('Walnüsse')

    const result = await markStillGood(writer, { householdId: foreignId, unitIds: [nuts], today })

    expect(result).toEqual({ ok: false, error: { kind: 'not-found' } })
    expect((await unitsOf('Walnüsse'))[0]?.checkedAt).toBeNull()
  })

  it('Rückgängig löscht nur den eben gesetzten Tag, im eigenen Haushalt', async () => {
    const nuts = await firstIdOf('Walnüsse')
    await markStillGood(writer, { householdId, unitIds: [nuts], today })

    await undoStillGood(writer, { householdId: foreignId, unitIds: [nuts], checkedAt: today })
    await undoStillGood(writer, {
      householdId,
      unitIds: [nuts],
      checkedAt: toCalendarDay('2026-11-01'),
    })
    expect((await unitsOf('Walnüsse'))[0]?.checkedAt).toBe(today)

    await undoStillGood(writer, { householdId, unitIds: [nuts], checkedAt: today })
    expect((await unitsOf('Walnüsse'))[0]?.checkedAt).toBeNull()
  })
})
