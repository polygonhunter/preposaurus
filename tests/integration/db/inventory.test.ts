import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { categories } from '../../../src/server/db/schema/catalog'
import { households } from '../../../src/server/db/schema/household'
import { products, units } from '../../../src/server/db/schema/inventory'
import { productGroups } from '../../../src/server/db/schema/recommendation'
import { expectConstraintViolation } from '../../helpers/db-errors'
import { createTestDb, type TestDb } from '../../helpers/test-db'

describe('Schema Vorrat', () => {
  let testDb: TestDb
  let householdId: string
  let categoryId: string

  beforeAll(async () => {
    testDb = await createTestDb()
    const [household] = await testDb.db.insert(households).values({ name: 'Test' }).returning()
    const [group] = await testDb.db
      .insert(productGroups)
      .values({ key: 'getreide', name: 'Getreide' })
      .returning()
    const [category] = await testDb.db
      .insert(categories)
      .values({ isSystem: true, key: 'nudeln', name: 'Nudeln', productGroupId: group?.id ?? '' })
      .returning()
    householdId = household?.id ?? ''
    categoryId = category?.id ?? ''
  })

  afterAll(async () => {
    await testDb.close()
  })

  const insertProduct = async (captureId?: string) => {
    const [product] = await testDb.db
      .insert(products)
      .values({
        householdId,
        categoryId,
        name: 'Nudeln',
        contentAmount: '500',
        contentUnit: 'g',
        ...(captureId === undefined ? {} : { captureId }),
      })
      .returning()
    if (product === undefined) throw new Error('Produkt fehlt')
    return product
  }

  it('legt eine Einheit im Vorrat mit Standardwerten für das MHD an', async () => {
    const product = await insertProduct()

    const [unit] = await testDb.db
      .insert(units)
      .values({ productId: product.id, bestBefore: '2027-09-30' })
      .returning()

    expect(unit).toMatchObject({
      status: 'vorrat',
      bestBefore: '2027-09-30',
      bestBeforePrecision: 'tag',
      bestBeforeKind: 'mhd',
      isBestBeforeEstimated: false,
      takenAt: null,
    })
  })

  it('lehnt einen unbekannten Status ab', async () => {
    const product = await insertProduct()

    await expectConstraintViolation(
      testDb.db
        .insert(units)
        // @ts-expect-error -- absichtlich ungültiger Status, den nur die DB abfangen soll
        .values({
          productId: product.id,
          bestBefore: '2027-01-31',
          status: 'weggeworfen',
          takenAt: new Date(),
        }),
      'einheit_status_check',
    )
  })

  it('verlangt beim Verbrauchen einen Zeitpunkt', async () => {
    const product = await insertProduct()

    await expectConstraintViolation(
      testDb.db
        .insert(units)
        .values({ productId: product.id, bestBefore: '2027-01-31', status: 'verbraucht' }),
      'einheit_entnahme_check',
    )
  })

  it('lehnt eine doppelte erfassung_id ab', async () => {
    const captureId = randomUUID()
    await insertProduct(captureId)

    await expectConstraintViolation(insertProduct(captureId), 'produkt_erfassung_id_unique')
  })

  it('lehnt eine eigene Kategorie ohne Haushalt ab', async () => {
    const [category] = await testDb.db.select().from(categories)

    await expectConstraintViolation(
      testDb.db.insert(categories).values({
        name: 'Eigene',
        productGroupId: category?.productGroupId ?? '',
      }),
      'kategorie_herkunft_check',
    )
  })
})
