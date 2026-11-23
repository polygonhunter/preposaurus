// „Angaben bearbeiten“ gegen die DB (#49): Die Kategorie folgt der Lebensmittelart, Nährwerte
// werden zur eigenen Angabe, fremde Produkte und fremde Stammdaten bleiben außen vor (#133).
import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createStock } from '../../../src/features/capture/application/create-stock'
import { updateProduct } from '../../../src/features/capture/application/update-product'
import { createProductEditRepository } from '../../../src/features/capture/data/product-edit-repository'
import { createStockWriteRepository } from '../../../src/features/capture/data/stock-write-repository'
import { createStockSchema } from '../../../src/features/capture/schemas/stock'
import type { UpdateProductInput } from '../../../src/features/capture/schemas/product-edit'
import { foodTypes } from '../../../src/server/db/schema/food-types'
import { products } from '../../../src/server/db/schema/inventory'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { setupCreateStock, type CreateStockSetup } from './create-stock-fixtures'

const now = new Date('2026-11-23T10:00:00Z')

describe('Produkt bearbeiten gegen die DB (#49)', () => {
  let testDb: TestDb
  let setup: CreateStockSetup
  let productId: string
  let foreignProductId: string

  async function insertProduct(householdId: string, userId: string, foodTypeId: string) {
    const draft = createStockSchema.parse({
      captureId: randomUUID(),
      method: 'manual',
      product: {
        kind: 'new',
        foodTypeId,
        content: { value: 500, unit: 'g' },
        nutrition: { kcal: 350, protein: 12, carbs: 70, fat: 2, source: 'ai-estimate' },
      },
      units: [{ bestBefore: null, count: 1 }],
    })
    const writer = createStockWriteRepository(testDb.db)
    const saved = await createStock({ writer, now: () => now }, { householdId, userId, draft })
    if (!saved.ok) throw new Error('Produkt nicht angelegt')
    return saved.value.productId
  }

  beforeAll(async () => {
    testDb = await createTestDb()
    setup = await setupCreateStock(testDb.db)
    productId = await insertProduct(setup.householdId, setup.userId, setup.noodlesId)
    const { foreign } = setup
    foreignProductId = await insertProduct(foreign.householdId, foreign.userId, setup.noodlesId)
  })

  afterAll(async () => {
    await testDb.close()
  })

  const run = (overrides: Partial<UpdateProductInput>, householdId = setup.householdId) =>
    updateProduct(
      { editor: createProductEditRepository(testDb.db), now: () => now },
      {
        householdId,
        input: {
          productId,
          foodTypeId: setup.noodlesId,
          name: null,
          content: { value: 500, unit: 'g' },
          containerId: null,
          storageLocationId: null,
          nutrition: { kcal: 350, protein: 12, carbs: 70, fat: 2 },
          confirmEstimate: false,
          ...overrides,
        },
      },
    )

  const productRow = async (id: string) =>
    (await testDb.db.select().from(products).where(eq(products.id, id)))[0]

  it('bestätigt eine Schätzung, ohne die Werte zu ändern', async () => {
    expect((await run({ confirmEstimate: true })).ok).toBe(true)

    expect(await productRow(productId)).toMatchObject({
      nutritionSource: 'ki_schaetzung',
      nutritionConfirmedAt: now,
    })
  })

  it('übernimmt Art samt Kategorie, Angaben und eigene Nährwerte', async () => {
    const [rice] = await testDb.db
      .select({ id: foodTypes.id, categoryId: foodTypes.categoryId, name: foodTypes.name })
      .from(foodTypes)
      .where(eq(foodTypes.key, 'reis'))
    if (rice === undefined) throw new Error('Reis fehlt im Seed')

    const result = await run({
      foodTypeId: rice.id,
      content: { value: 1000, unit: 'g' },
      containerId: setup.packageId,
      storageLocationId: setup.storageLocationId,
      nutrition: { kcal: 349, protein: 7, carbs: 77, fat: 0.6 },
    })

    expect(result).toEqual({ ok: true, value: { foodTypeId: rice.id } })
    expect(await productRow(productId)).toMatchObject({
      foodTypeId: rice.id,
      categoryId: rice.categoryId,
      name: rice.name,
      contentAmount: '1000.00',
      containerId: setup.packageId,
      storageLocationId: setup.storageLocationId,
      kcalPer100: '349.00',
      nutritionSource: 'manuell',
      nutritionConfirmedAt: null,
    })
  })

  it('kehrt ohne Nährwerte zum Richtwert zurück', async () => {
    await run({ nutrition: { kcal: null, protein: null, carbs: null, fat: null } })

    expect(await productRow(productId)).toMatchObject({ kcalPer100: null, nutritionSource: null })
  })

  it('ändert kein fremdes Produkt und nutzt keine fremden Stammdaten', async () => {
    const { foreign } = setup
    expect(await run({ productId: foreignProductId })).toEqual({
      ok: false,
      error: { kind: 'not-found', reference: 'product' },
    })
    expect(await run({ foodTypeId: foreign.foodTypeId })).toEqual({
      ok: false,
      error: { kind: 'not-found', reference: 'food-type' },
    })
    expect(await run({ storageLocationId: foreign.storageLocationId })).toEqual({
      ok: false,
      error: { kind: 'not-found', reference: 'storage-location' },
    })
    expect((await productRow(foreignProductId))?.nutritionConfirmedAt).toBeNull()
  })
})
