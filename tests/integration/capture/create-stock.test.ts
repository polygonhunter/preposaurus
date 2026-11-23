import { randomUUID } from 'node:crypto'
import { count, eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createStock } from '../../../src/features/capture/application/create-stock'
import type { StockWriter } from '../../../src/features/capture/application/stock-writer'
import { createStockWriteRepository } from '../../../src/features/capture/data/stock-write-repository'
import { createStockSchema } from '../../../src/features/capture/schemas/stock'
import { captures } from '../../../src/server/db/schema/confirmed-captures'
import { products, units } from '../../../src/server/db/schema/inventory'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { setupCreateStock, type CreateStockSetup } from './create-stock-fixtures'

const now = new Date('2026-11-22T10:00:00Z')

describe('Speichern einer Erfassung gegen die DB (#51)', () => {
  let testDb: TestDb
  let setup: CreateStockSetup
  let writer: StockWriter

  beforeAll(async () => {
    testDb = await createTestDb()
    setup = await setupCreateStock(testDb.db)
    writer = createStockWriteRepository(testDb.db)
  })

  afterAll(async () => {
    await testDb.close()
  })

  function newDraft(product: Record<string, unknown> = {}) {
    return createStockSchema.parse({
      captureId: randomUUID(),
      method: 'manual',
      product: {
        kind: 'new',
        foodTypeId: setup.noodlesId,
        name: 'Spaghetti',
        content: { value: 500, unit: 'g' },
        containerId: setup.packageId,
        storageLocationId: setup.storageLocationId,
        ...product,
      },
      units: [
        { bestBefore: { date: '2027-09-01', precision: 'month' }, count: 2 },
        { bestBefore: { date: '2028-01-01', precision: 'year', isEstimated: true }, count: 1 },
        { bestBefore: null, count: 1 },
      ],
    })
  }

  interface Actor {
    householdId: string
    userId: string
  }

  const save = (draft: ReturnType<typeof newDraft>, by: Actor = setup, using = writer) =>
    createStock(
      { writer: using, now: () => now },
      { householdId: by.householdId, userId: by.userId, draft },
    )

  async function countRows() {
    const [captureRows] = await testDb.db.select({ value: count() }).from(captures)
    const [productRows] = await testDb.db.select({ value: count() }).from(products)
    const [unitRows] = await testDb.db.select({ value: count() }).from(units)
    return { captures: captureRows?.value, products: productRows?.value, units: unitRows?.value }
  }

  it('legt Produkt und Einheiten mit Datum, „Datum fehlt“ und Schätzung an', async () => {
    const result = await save(newDraft())
    const productId = result.ok ? result.value.productId : ''

    const [product] = await testDb.db.select().from(products).where(eq(products.id, productId))
    const saved = await testDb.db
      .select({
        bestBefore: units.bestBefore,
        precision: units.bestBeforePrecision,
        isEstimated: units.isBestBeforeEstimated,
      })
      .from(units)
      .where(eq(units.productId, productId))

    expect(product).toMatchObject({
      householdId: setup.householdId,
      categoryId: setup.noodlesCategoryId,
      contentAmount: '500.00',
      nutritionSource: null,
    })
    expect(saved).toEqual(
      expect.arrayContaining([
        { bestBefore: '2027-09-30', precision: 'monat', isEstimated: false },
        { bestBefore: '2028-12-31', precision: 'jahr', isEstimated: true },
        { bestBefore: null, precision: null, isEstimated: false },
      ]),
    )
    expect(saved).toHaveLength(4)
  })

  it('speichert Nährwerte mit Herkunft und Bestätigung einer Schätzung', async () => {
    const nutrition = { kcal: 350, protein: 12, carbs: 70, fat: null, source: 'ai-estimate' }

    const result = await save(newDraft({ nutrition: { ...nutrition, isConfirmed: true } }))
    const productId = result.ok ? result.value.productId : ''
    const [product] = await testDb.db.select().from(products).where(eq(products.id, productId))

    expect(product).toMatchObject({
      kcalPer100: '350.00',
      fatPer100: null,
      nutritionSource: 'ki_schaetzung',
      nutritionConfirmedAt: now,
    })
  })

  it('legt bei doppeltem Aufruf nichts doppelt an, auch gleichzeitig', async () => {
    const draft = newDraft()
    const first = await save(draft)
    const before = await countRows()

    const [second, third] = await Promise.all([save(draft), save(draft)])

    expect(await countRows()).toEqual(before)
    expect(second).toEqual({ ok: true, value: { ...(first.ok && first.value), isReplay: true } })
    expect(third).toEqual(second)
  })

  it('lässt nach einem Abbruch mitten in der Transaktion nichts zurück', async () => {
    const before = await countRows()
    const failing: StockWriter = {
      ...writer,
      transaction: (work) =>
        writer.transaction((tx) =>
          work({ ...tx, insertUnits: () => Promise.reject(new Error('Abbruch')) }),
        ),
    }

    await expect(save(newDraft(), setup, failing)).rejects.toThrow('Abbruch')

    expect(await countRows()).toEqual(before)
  })

  it('fügt Nachschub zum vorhandenen Produkt hinzu', async () => {
    const first = await save(
      newDraft({ name: 'Nachschub-Nudeln', content: { value: 750, unit: 'g' } }),
    )
    const productId = first.ok ? first.value.productId : ''
    const refill = createStockSchema.parse({
      captureId: randomUUID(),
      method: 'photo',
      product: { kind: 'existing', productId },
      units: [{ bestBefore: null, count: 5 }],
    })

    const result = await save(refill)

    expect(result).toMatchObject({ ok: true, value: { productId, unitCount: 5 } })
  })

  it.each([
    ['food-type', () => ({ foodTypeId: setup.foreign.foodTypeId })],
    ['storage-location', () => ({ storageLocationId: setup.foreign.storageLocationId })],
  ])('lehnt fremde Stammdaten ab (%s)', async (reference, change) => {
    const before = await countRows()

    const result = await save(newDraft(change()))

    expect(result).toEqual({ ok: false, error: { kind: 'not-found', reference } })
    expect(await countRows()).toEqual(before)
  })

  it('kennt kein Produkt und keine Erfassung eines fremden Haushalts', async () => {
    const foreignDraft = newDraft({ foodTypeId: setup.foreign.foodTypeId, storageLocationId: null })
    const foreign = await save(foreignDraft, setup.foreign)
    const productId = foreign.ok ? foreign.value.productId : ''
    const intoForeign = createStockSchema.parse({
      captureId: randomUUID(),
      method: 'manual',
      product: { kind: 'existing', productId },
      units: [{ bestBefore: null, count: 1 }],
    })

    expect(foreign.ok).toBe(true)
    expect(await save(intoForeign)).toEqual({
      ok: false,
      error: { kind: 'not-found', reference: 'product' },
    })
    expect(await save(foreignDraft)).toEqual({ ok: false, error: { kind: 'conflict' } })
  })
})
