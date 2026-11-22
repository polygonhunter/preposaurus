import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { SYSTEM_FOOD_TYPES } from '../../../db/seeds/stammdaten/lebensmittelarten'
import { categories } from '../../../src/server/db/schema/catalog'
import { foodTypes } from '../../../src/server/db/schema/food-types'
import { households } from '../../../src/server/db/schema/household'
import { products } from '../../../src/server/db/schema/inventory'
import { expectConstraintViolation } from '../../helpers/db-errors'
import { insertBasics, type Basics } from '../../helpers/db-fixtures'
import { buildHousehold, buildProduct } from '../../../db/seeds/factories'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { toOwnKey } from '../../../src/shared/lib/slug'

describe('Schema Lebensmittelart', () => {
  let testDb: TestDb
  let basics: Basics

  const foodTypeId = async (key: string) => {
    const [row] = await testDb.db
      .select({ id: foodTypes.id, categoryId: foodTypes.categoryId })
      .from(foodTypes)
      .where(eq(foodTypes.key, key))
    if (row === undefined) throw new Error(`Lebensmittelart ${key} fehlt`)
    return row
  }

  const ownFoodType = (name: string) => ({
    name,
    key: toOwnKey(name) ?? '',
    categoryId: basics.categoryId,
  })

  beforeAll(async () => {
    testDb = await createTestDb()
    basics = await insertBasics(testDb.db)
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('spielt alle System-Arten ein, jede mit Kategorie', async () => {
    const rows = await testDb.db.select().from(foodTypes).where(eq(foodTypes.isSystem, true))

    expect(rows).toHaveLength(SYSTEM_FOOD_TYPES.length)
    expect(rows.every((row) => row.householdId === null && row.kcalPer100 === null)).toBe(true)
  })

  it('erlaubt eine eigene Art je Haushalt, auch mit gleichem Namen in einem anderen Haushalt', async () => {
    const other = buildHousehold({ name: 'Zweiter Haushalt' })
    await testDb.db.insert(households).values(other)
    const ownType = ownFoodType('Dinkelnudeln')

    await testDb.db.insert(foodTypes).values({ ...ownType, householdId: basics.householdId })
    await testDb.db.insert(foodTypes).values({ ...ownType, householdId: other.id })

    await expectConstraintViolation(
      testDb.db
        .insert(foodTypes)
        .values({ ...ownType, key: 'eigen_anders', householdId: basics.householdId }),
      'lebensmittelart_name_eindeutig',
    )
  })

  it('lehnt einen doppelten Schlüssel einer eigenen Art im selben Haushalt ab', async () => {
    const ownType = { ...ownFoodType('Roggenbrot'), householdId: basics.householdId }
    await testDb.db.insert(foodTypes).values(ownType)

    await expectConstraintViolation(
      testDb.db.insert(foodTypes).values({ ...ownType, name: 'Roggenbrot hell' }),
      'lebensmittelart_schluessel_eigen_eindeutig',
    )
  })

  it('lehnt eine eigene Art mit dem Schlüssel einer System-Art ab', async () => {
    await expectConstraintViolation(
      testDb.db.insert(foodTypes).values({
        key: 'spaghetti',
        name: 'Meine Spaghetti',
        categoryId: basics.categoryId,
        householdId: basics.householdId,
      }),
      'lebensmittelart_herkunft_check',
    )
  })

  it('lehnt einen doppelten System-Schlüssel ab', async () => {
    await expectConstraintViolation(
      testDb.db.insert(foodTypes).values({
        isSystem: true,
        key: 'spaghetti',
        name: 'Spaghetti doppelt',
        categoryId: basics.categoryId,
      }),
      'lebensmittelart_schluessel_system_eindeutig',
    )
  })

  it('lehnt eine eigene Art ohne Haushalt ab', async () => {
    await expectConstraintViolation(
      testDb.db.insert(foodTypes).values(ownFoodType('Ohne Haushalt')),
      'lebensmittelart_herkunft_check',
    )
  })

  it('verlangt am Produkt die Kategorie der Lebensmittelart', async () => {
    const tuna = await foodTypeId('thunfisch')

    await expectConstraintViolation(
      testDb.db.insert(products).values(
        buildProduct({
          householdId: basics.householdId,
          categoryId: basics.categoryId,
          foodTypeId: tuna.id,
        }),
      ),
      'produkt_lebensmittelart_kategorie_fk',
    )
  })

  it('zieht die Kategorie des Produkts mit, wenn die Art in eine andere Kategorie wandert', async () => {
    const spaghetti = await foodTypeId('spaghetti')
    const product = buildProduct({
      householdId: basics.householdId,
      categoryId: spaghetti.categoryId,
      foodTypeId: spaghetti.id,
    })
    await testDb.db.insert(products).values(product)
    const ready = await foodTypeId('ravioli')

    await testDb.db
      .update(foodTypes)
      .set({ categoryId: ready.categoryId })
      .where(eq(foodTypes.id, spaghetti.id))

    const [moved] = await testDb.db
      .select({ categoryId: products.categoryId })
      .from(products)
      .where(eq(products.id, product.id))
    expect(moved?.categoryId).toBe(ready.categoryId)
  })

  it('schützt Arten mit Produkten und Kategorien mit Arten vor dem Löschen', async () => {
    const spaghetti = await foodTypeId('spaghetti')
    const apple = await foodTypeId('apfelmus')

    await expectConstraintViolation(
      testDb.db.delete(foodTypes).where(eq(foodTypes.id, spaghetti.id)),
      'produkt_lebensmittelart_kategorie_fk',
    )
    await expectConstraintViolation(
      testDb.db.delete(categories).where(eq(categories.id, apple.categoryId)),
      'lebensmittelart_kategorie_id_kategorie_id_fk',
    )
  })
})
