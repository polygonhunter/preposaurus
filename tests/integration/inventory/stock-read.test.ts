import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getFoodTypeDetail } from '../../../src/features/inventory/application/get-food-type-detail'
import { getFoodTypeLevel } from '../../../src/features/inventory/application/get-food-type-level'
import { getStockOverview } from '../../../src/features/inventory/application/get-stock-overview'
import { searchStock } from '../../../src/features/inventory/application/search-stock'
import type { StockReader } from '../../../src/features/inventory/application/stock-reader'
import {
  foodTypeDetailSchema,
  foodTypeLevelSchema,
  stockFilterSchema,
  stockOverviewSchema,
  stockSearchSchema,
} from '../../../src/features/inventory/schemas'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { setupStockRead, today } from './stock-read-fixtures'

describe('Vorrat lesen gegen die Datenbank (Demo-Daten)', () => {
  let testDb: TestDb
  let reader: StockReader
  let householdId: string
  let foreignId: string
  let spaghettiId: string

  beforeAll(async () => {
    testDb = await createTestDb()
    ;({ reader, householdId, foreignId, spaghettiId } = await setupStockRead(testDb.db))
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('summiert je Warengruppe wie die Fachlogik', async () => {
    const overview = stockOverviewSchema.parse(
      await getStockOverview(reader, { householdId, today }),
    )
    const totals = Object.fromEntries(
      overview.groups.map((group) => [group.key, [group.totals.packages, group.totals.kcal]]),
    )

    // Nudeln 3 × 500 g × 359 kcal, Haferflocken 2 × 500 g × 372 kcal (eine ohne Datum zählt heute)
    expect(totals['getreide']).toEqual([5, 9105])
    expect(totals['gemuese_huelsenfruechte']).toEqual([3, 1080])
    // Walnüsse: abgelaufen, ohne Nährwerte und ohne Richtwert
    expect(totals['obst_nuesse']).toEqual([0, 0])
    expect(totals['milch']).toEqual([3, 1920])
    expect(totals['fleisch_fisch_eier']).toEqual([1, 285])
    expect(totals['wasser']).toEqual([6, 0])
    expect(totals['sonstiges']).toEqual([2, 1440])
    expect(totals['fette_oele']).toEqual([0, 0])
  })

  it('nennt nächstes MHD, „Datum fehlt“ und ohne aktive Quelle weder Tage noch Abdeckung', async () => {
    const overview = await getStockOverview(reader, { householdId, today })
    const grain = overview.groups.find((group) => group.key === 'getreide')

    expect(grain?.totals).toMatchObject({
      withoutDate: 1,
      nextBestBefore: { date: '2026-12-02' },
      nextState: 'urgent',
      energyDays: null,
      amounts: { g: 2500, ml: 0 },
    })
    expect(overview.groups.every((group) => group.coverage === null)).toBe(true)
  })

  it('zeigt Produkte ohne Lebensmittelart als eigene Zeile unter ihrer Kategorie', async () => {
    const result = await getFoodTypeLevel(reader, {
      householdId,
      today,
      groupKey: 'gemuese_huelsenfruechte',
    })
    const level = foodTypeLevelSchema.parse(result.ok ? result.value : null)

    expect(level.categories[0]?.rows).toMatchObject([
      { target: { kind: 'product' }, name: 'Linsen', packagesInStock: 3, state: 'good' },
    ])
  })

  it('liefert das Detail der Spaghetti mit Herkunft der Nährwerte', async () => {
    const target = { kind: 'food-type', id: spaghettiId } as const
    const result = await getFoodTypeDetail(reader, { householdId, today, target })
    const detail = foodTypeDetailSchema.parse(result.ok ? result.value : null)

    expect(detail.products.map((product) => product.name)).toEqual(['Nudeln'])
    expect(detail.products[0]?.nutrition).toMatchObject({ source: 'label', gap: null })
    expect(detail.totals).toMatchObject({ packages: 3, kcal: 5385 })
  })

  it('sammelt „Datum fehlt“ und fehlende Nährwerte im Filter „Unvollständig“', async () => {
    const filter = stockFilterSchema.parse({ status: 'incomplete' })
    const result = stockSearchSchema.parse(
      await searchStock(reader, { householdId, today, filter }),
    )

    expect(result.counts).toMatchObject({ incomplete: 2, consumed: 1, discarded: 1 })
    expect(result.groups.flatMap((group) => group.rows.map((row) => row.name))).toEqual([
      'Haferflocken',
      'Walnüsse',
    ])
  })

  it('zeigt einem fremden Haushalt nichts vom Demo-Haushalt und umgekehrt', async () => {
    const target = { kind: 'food-type', id: spaghettiId } as const
    const filter = stockFilterSchema.parse({ search: 'spaghetti' })
    const own = await searchStock(reader, { householdId, today, filter })
    const foreign = await searchStock(reader, { householdId: foreignId, today, filter })
    const foreignDetail = await getFoodTypeDetail(reader, { householdId: foreignId, today, target })

    expect(own.groups.flatMap((group) => group.rows.map((row) => row.packagesInStock))).toEqual([3])
    expect(foreign.counts['in-stock']).toBe(2)
    expect(foreignDetail.ok && foreignDetail.value.products.map((product) => product.name)).toEqual(
      ['Fremde Spaghetti'],
    )
  })

  it('liefert für einen unbekannten Haushalt überall leere Ergebnisse', async () => {
    const unknown = '00000000-0000-4000-8000-000000000000'
    const overview = await getStockOverview(reader, { householdId: unknown, today })
    const target = { kind: 'food-type', id: spaghettiId } as const
    const detail = await getFoodTypeDetail(reader, { householdId: unknown, today, target })

    expect(overview.groups.every((group) => group.totals.packages === 0)).toBe(true)
    expect(detail).toEqual({ ok: false, error: { kind: 'not-found' } })
  })
})
