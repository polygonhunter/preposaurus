// Bearbeiten und endgültiges Löschen gegen die Datenbank (#49, #50): Mandantenfilter, „Noch gut“
// wird mit einem neuen Datum zurückgesetzt, Löschen räumt Einheiten, Fotozeilen und leere
// Erfassungen auf und lässt andere Haushalte unberührt. Alle Werte sind erfunden.
import { eq, inArray } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { buildCapture, buildProduct, buildUnit } from '../../../db/seeds/factories'
import { changeUnitDates } from '../../../src/features/inventory/application/change-unit-dates'
import { createEntryEraseRepository } from '../../../src/features/inventory/data/entry-erase-repository'
import { createUnitDateRepository } from '../../../src/features/inventory/data/unit-date-repository'
import type { Database } from '../../../src/server/db/connection'
import { photos } from '../../../src/server/db/schema/capture'
import { captures } from '../../../src/server/db/schema/confirmed-captures'
import { products, units } from '../../../src/server/db/schema/inventory'
import { toCalendarDay } from '../../../src/shared/lib/dates'
import { insertBasics, type Basics } from '../../helpers/db-fixtures'
import { createTestDb, type TestDb } from '../../helpers/test-db'

interface Stock {
  productId: string
  captureId: string
  unitIds: string[]
  photoId: string
}

/** Ein Produkt mit drei Packungen aus einer Erfassung, eine davon verbraucht, dazu ein Foto. */
async function insertStock(db: Database, basics: Basics): Promise<Stock> {
  const { householdId, userId, categoryId } = basics
  const product = buildProduct({ householdId, categoryId })
  await db.insert(products).values(product)
  const capture = buildCapture({ householdId, userId })
  await db.insert(captures).values(capture)
  const rows = [
    buildUnit({
      productId: product.id,
      captureId: capture.id,
      bestBefore: '2026-10-31',
      checkedAt: '2026-11-10',
    }),
    buildUnit({ productId: product.id, captureId: capture.id, bestBefore: null }),
    buildUnit({
      productId: product.id,
      captureId: capture.id,
      bestBefore: '2026-09-30',
      status: 'verbraucht',
      takenAt: new Date('2026-11-01T10:00:00Z'),
    }),
  ]
  await db.insert(units).values(rows)
  const photoId = crypto.randomUUID()
  await db.insert(photos).values({
    id: photoId,
    householdId,
    role: 'verpackung',
    path: `${householdId}/${photoId}-full.jpg`,
    mimeType: 'image/jpeg',
    status: 'fest',
    productId: product.id,
  })
  return { productId: product.id, captureId: capture.id, unitIds: rows.map((r) => r.id), photoId }
}

describe('Bearbeiten und Löschen im Vorrat (#49, #50)', () => {
  let testDb: TestDb
  let own: Basics
  let foreign: Basics
  let stock: Stock
  let foreignStock: Stock

  beforeAll(async () => {
    testDb = await createTestDb()
    own = await insertBasics(testDb.db)
    foreign = await insertBasics(testDb.db)
  })

  beforeEach(async () => {
    stock = await insertStock(testDb.db, own)
    foreignStock = await insertStock(testDb.db, foreign)
  })

  afterAll(async () => {
    await testDb.close()
  })

  const unitRow = async (unitId: string) =>
    (await testDb.db.select().from(units).where(eq(units.id, unitId)))[0]

  const exists = async (table: typeof products | typeof captures | typeof photos, id: string) =>
    (await testDb.db.select({ id: table.id }).from(table).where(eq(table.id, id))).length > 0

  describe('Datum ändern', () => {
    const editor = () => createUnitDateRepository(testDb.db)

    it('setzt „Noch gut“ zurück und trägt ein fehlendes Datum nach', async () => {
      const [checked = '', missing = ''] = stock.unitIds

      const result = await changeUnitDates(editor(), {
        householdId: own.householdId,
        unitIds: [checked, missing],
        bestBefore: { date: toCalendarDay('2027-03-01'), precision: 'month' },
        kind: 'best-before',
      })

      expect(result).toEqual({ ok: true, value: { changed: 2 } })
      for (const unitId of [checked, missing]) {
        expect(await unitRow(unitId)).toMatchObject({
          bestBefore: '2027-03-31',
          bestBeforePrecision: 'monat',
          checkedAt: null,
        })
      }
    })

    it('ändert weder fremde noch entnommene Packungen', async () => {
      const [foreignUnit = ''] = foreignStock.unitIds
      const consumed = stock.unitIds[2] ?? ''

      const result = await changeUnitDates(editor(), {
        householdId: own.householdId,
        unitIds: [foreignUnit, consumed],
        bestBefore: { date: toCalendarDay('2027-03-31'), precision: 'day' },
        kind: 'best-before',
      })

      expect(result).toEqual({ ok: false, error: { kind: 'not-found' } })
      expect((await unitRow(foreignUnit))?.bestBefore).toBe('2026-10-31')
      expect((await unitRow(consumed))?.bestBefore).toBe('2026-09-30')
    })

    it('schreibt die Datumsart, nur im eigenen Haushalt (#300)', async () => {
      const [ownUnit = ''] = stock.unitIds
      const [foreignUnit = ''] = foreignStock.unitIds
      const bestBefore = { date: toCalendarDay('2027-03-31'), precision: 'day' as const }

      const toUseBy = await changeUnitDates(editor(), {
        householdId: own.householdId,
        unitIds: [ownUnit, foreignUnit],
        bestBefore,
        kind: 'use-by',
      })

      expect(toUseBy).toEqual({ ok: true, value: { changed: 1 } })
      expect(await unitRow(ownUnit)).toMatchObject({
        bestBeforeKind: 'verbrauchen_bis',
        checkedAt: null,
      })
      expect((await unitRow(foreignUnit))?.bestBeforeKind).toBe('mhd')

      await changeUnitDates(editor(), {
        householdId: own.householdId,
        unitIds: [ownUnit],
        bestBefore,
        kind: 'best-before',
      })
      expect((await unitRow(ownUnit))?.bestBeforeKind).toBe('mhd')
    })

    it('liest die Zeile nur im eigenen Haushalt', async () => {
      const [first = ''] = foreignStock.unitIds
      expect(await editor().loadSource(own.householdId, first)).toBeNull()
      const source = await editor().loadSource(own.householdId, stock.unitIds[0] ?? '')
      expect(source?.stockUnits.map((unit) => unit.id).sort()).toEqual(
        stock.unitIds.slice(0, 2).sort(),
      )
    })
  })

  describe('Fehlerfassung löschen', () => {
    const eraser = () => createEntryEraseRepository(testDb.db)

    it('löscht ein Produkt samt Verlauf, Fotozeilen und leerer Erfassung', async () => {
      const erased = await eraser().eraseRows(own.householdId, {
        kind: 'product',
        productId: stock.productId,
      })

      expect(erased).toEqual({
        photos: [{ id: stock.photoId, householdId: own.householdId }],
        isProductRemoved: true,
      })
      const left = await testDb.db.select().from(units).where(inArray(units.id, stock.unitIds))
      expect(left).toEqual([])
      expect(await exists(products, stock.productId)).toBe(false)
      expect(await exists(photos, stock.photoId)).toBe(false)
      expect(await exists(captures, stock.captureId)).toBe(false)
      expect(await exists(products, foreignStock.productId)).toBe(true)
    })

    it('löscht eine Packung und lässt Produkt und Erfassung stehen, solange noch etwas dran hängt', async () => {
      const [first = ''] = stock.unitIds

      const erased = await eraser().eraseRows(own.householdId, { kind: 'unit', unitId: first })

      expect(erased).toEqual({ photos: [], isProductRemoved: false })
      expect(await unitRow(first)).toBeUndefined()
      expect(await exists(products, stock.productId)).toBe(true)
      expect(await exists(captures, stock.captureId)).toBe(true)
    })

    it('nimmt mit der letzten Packung auch Produkt, Foto und Erfassung mit', async () => {
      const [first = '', second = '', third = ''] = stock.unitIds
      await eraser().eraseRows(own.householdId, { kind: 'unit', unitId: first })
      await eraser().eraseRows(own.householdId, { kind: 'unit', unitId: second })

      const erased = await eraser().eraseRows(own.householdId, { kind: 'unit', unitId: third })

      expect(erased).toEqual({
        photos: [{ id: stock.photoId, householdId: own.householdId }],
        isProductRemoved: true,
      })
      expect(await exists(products, stock.productId)).toBe(false)
      expect(await exists(captures, stock.captureId)).toBe(false)
    })

    it('findet nichts aus einem fremden Haushalt und löscht dort nichts', async () => {
      const target = { kind: 'product', productId: foreignStock.productId } as const
      expect(await eraser().eraseRows(own.householdId, target)).toBeNull()
      const unit = { kind: 'unit', unitId: foreignStock.unitIds[0] ?? '' } as const
      expect(await eraser().eraseRows(own.householdId, unit)).toBeNull()
      expect(await exists(products, foreignStock.productId)).toBe(true)
      expect(await unitRow(foreignStock.unitIds[0] ?? '')).toBeDefined()
    })
  })
})
