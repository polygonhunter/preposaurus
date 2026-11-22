import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { categories, storageLocations } from '../../../src/server/db/schema/catalog'
import { products, units } from '../../../src/server/db/schema/inventory'
import { expectConstraintViolation } from '../../helpers/db-errors'
import { insertBasics } from '../../helpers/db-fixtures'
import { buildProduct, buildStorageLocation } from '../../../db/seeds/factories'
import { createTestDb, type TestDb } from '../../helpers/test-db'

describe('Schema Vorrat', () => {
  let testDb: TestDb
  let householdId: string
  let categoryId: string
  let captureId: string

  beforeAll(async () => {
    testDb = await createTestDb()
    ;({ householdId, categoryId, captureId } = await insertBasics(testDb.db))
  })

  afterAll(async () => {
    await testDb.close()
  })

  const insertProduct = async () => {
    const product = buildProduct({ householdId, categoryId })
    await testDb.db.insert(products).values(product)
    return product
  }

  it('legt eine Einheit im Vorrat mit Standardwerten für das MHD an', async () => {
    const product = await insertProduct()

    const [unit] = await testDb.db
      .insert(units)
      .values({
        productId: product.id,
        captureId,
        bestBefore: '2027-09-30',
        bestBeforePrecision: 'tag',
      })
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

  it('speichert eine Einheit ohne MHD als „Datum fehlt“', async () => {
    const product = await insertProduct()

    const [unit] = await testDb.db
      .insert(units)
      .values({ productId: product.id, captureId })
      .returning()

    expect(unit).toMatchObject({
      bestBefore: null,
      bestBeforePrecision: null,
      isBestBeforeEstimated: false,
    })
  })

  it('lehnt ein geschätztes MHD ohne Datum ab', async () => {
    const product = await insertProduct()

    await expectConstraintViolation(
      testDb.db
        .insert(units)
        .values({ productId: product.id, captureId, isBestBeforeEstimated: true }),
      'einheit_mhd_geschaetzt_check',
    )
  })

  it.each([
    { bestBefore: '2027-09-30', bestBeforePrecision: null },
    { bestBefore: null, bestBeforePrecision: 'monat' as const },
  ])('verlangt die Genauigkeit genau dann, wenn es ein Datum gibt (%o)', async (dates) => {
    const product = await insertProduct()

    await expectConstraintViolation(
      testDb.db.insert(units).values({ productId: product.id, captureId, ...dates }),
      'einheit_mhd_genauigkeit_leer_check',
    )
  })

  it('lehnt einen unbekannten Status ab', async () => {
    const product = await insertProduct()

    await expectConstraintViolation(
      testDb.db
        .insert(units)
        // @ts-expect-error -- absichtlich ungültiger Status, den nur die DB abfangen soll
        .values({
          productId: product.id,
          captureId,
          status: 'weggeworfen',
          takenAt: new Date(),
        }),
      'einheit_status_check',
    )
  })

  it('verlangt beim Verbrauchen einen Zeitpunkt', async () => {
    const product = await insertProduct()

    await expectConstraintViolation(
      testDb.db.insert(units).values({ productId: product.id, captureId, status: 'verbraucht' }),
      'einheit_entnahme_check',
    )
  })

  it('verlangt zur Bestätigung der Nährwerte eine Quelle', async () => {
    await expectConstraintViolation(
      testDb.db.insert(products).values(
        buildProduct({
          householdId,
          categoryId,
          nutritionSource: null,
          nutritionConfirmedAt: new Date(),
        }),
      ),
      'produkt_naehrwerte_bestaetigt_check',
    )
  })

  it('lehnt eine unbekannte Nährwertquelle ab', async () => {
    await expectConstraintViolation(
      testDb.db
        .insert(products)
        // @ts-expect-error -- absichtlich ungültige Quelle, die nur die DB abfangen soll
        .values(buildProduct({ householdId, categoryId, nutritionSource: 'geraten' })),
      'produkt_naehrwerte_quelle_check',
    )
  })

  it('speichert ein Produkt ohne Nährwerte und ohne Quelle', async () => {
    const product = buildProduct({
      householdId,
      categoryId,
      kcalPer100: null,
      nutritionSource: null,
    })

    await expect(testDb.db.insert(products).values(product)).resolves.toBeDefined()
  })

  it.each([
    { kcalPer100: null, nutritionSource: 'tabelle' as const },
    { kcalPer100: null, fatPer100: '3.5', nutritionSource: null },
  ])('verlangt eine Quelle genau dann, wenn es Nährwerte gibt (%o)', async (nutrition) => {
    await expectConstraintViolation(
      testDb.db.insert(products).values(buildProduct({ householdId, categoryId, ...nutrition })),
      'produkt_naehrwerte_vollstaendig_check',
    )
  })

  it('legt einen Lagerort sichtbar an, ausblenden geht statt löschen', async () => {
    const [location] = await testDb.db
      .insert(storageLocations)
      .values(buildStorageLocation({ householdId, name: 'Dachboden' }))
      .returning({ isHidden: storageLocations.isHidden })

    expect(location?.isHidden).toBe(false)
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
