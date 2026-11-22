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

  const macroColumns = {
    protein: foodTypes.proteinPer100,
    carbs: foodTypes.carbsPer100,
    fat: foodTypes.fatPer100,
  }

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
    expect(rows.every((row) => row.householdId === null && row.categoryId !== '')).toBe(true)
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
        key: 'nudeln',
        name: 'Meine Nudeln',
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
        key: 'nudeln',
        name: 'Nudeln doppelt',
        categoryId: basics.categoryId,
      }),
      'lebensmittelart_schluessel_system_eindeutig',
    )
  })

  it('speichert Makro-Richtwerte und lehnt negative ab', async () => {
    const ownType = { ...ownFoodType('Linsenmehl'), householdId: basics.householdId }
    const macros = { proteinPer100: '24.0', carbsPer100: '48.0', fatPer100: '2.0' }
    const [saved] = await testDb.db
      .insert(foodTypes)
      .values({ ...ownType, ...macros })
      .returning(macroColumns)
    expect(saved).toEqual({ protein: '24.0', carbs: '48.0', fat: '2.0' })

    await expectConstraintViolation(
      testDb.db
        .insert(foodTypes)
        .values({ ...ownFoodType('Minusmehl'), householdId: basics.householdId, fatPer100: '-1' }),
      'lebensmittelart_makros_check',
    )
  })

  it('lehnt eine eigene Art ohne Haushalt ab', async () => {
    await expectConstraintViolation(
      testDb.db.insert(foodTypes).values(ownFoodType('Ohne Haushalt')),
      'lebensmittelart_herkunft_check',
    )
  })

  it('verlangt am Produkt die Kategorie der Lebensmittelart', async () => {
    const tuna = await foodTypeId('thunfisch_konserve')

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
    const noodles = await foodTypeId('nudeln')
    const product = buildProduct({
      householdId: basics.householdId,
      categoryId: noodles.categoryId,
      foodTypeId: noodles.id,
    })
    await testDb.db.insert(products).values(product)
    const ready = await foodTypeId('ravioli')

    await testDb.db
      .update(foodTypes)
      .set({ categoryId: ready.categoryId })
      .where(eq(foodTypes.id, noodles.id))

    const [moved] = await testDb.db
      .select({ categoryId: products.categoryId })
      .from(products)
      .where(eq(products.id, product.id))
    expect(moved?.categoryId).toBe(ready.categoryId)
  })

  it('schützt Arten mit Produkten und Kategorien mit Arten vor dem Löschen', async () => {
    const noodles = await foodTypeId('nudeln')
    const apple = await foodTypeId('apfelmus')

    await expectConstraintViolation(
      testDb.db.delete(foodTypes).where(eq(foodTypes.id, noodles.id)),
      'produkt_lebensmittelart_kategorie_fk',
    )
    await expectConstraintViolation(
      testDb.db.delete(categories).where(eq(categories.id, apple.categoryId)),
      'lebensmittelart_kategorie_id_kategorie_id_fk',
    )
  })
})
