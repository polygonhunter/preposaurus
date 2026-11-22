import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { seedMasterData } from '../../../db/seeds/master-data'
import { buildProduct } from '../../../db/seeds/factories'
import { categories } from '../../../src/server/db/schema/catalog'
import { foodTypes } from '../../../src/server/db/schema/food-types'
import { products } from '../../../src/server/db/schema/inventory'
import { productGroups } from '../../../src/server/db/schema/recommendation'
import { insertBasics, type Basics } from '../../helpers/db-fixtures'
import { createTestDb, type TestDb } from '../../helpers/test-db'

// Stand einer Datenbank mit der ersten Startliste: System-Einträge, die der Seed nicht mehr kennt.
describe('Seed Stammdaten: entfallene System-Einträge', () => {
  let testDb: TestDb
  let basics: Basics

  const insertOldFoodType = async (key: string, categoryId = basics.categoryId) => {
    const [row] = await testDb.db
      .insert(foodTypes)
      .values({ isSystem: true, key, name: `Alt ${key}`, categoryId })
      .returning({ id: foodTypes.id, categoryId: foodTypes.categoryId })
    if (row === undefined) throw new Error(`${key} nicht angelegt`)
    return row
  }

  const insertOldCategory = async (key: string) => {
    const [group] = await testDb.db.select({ id: productGroups.id }).from(productGroups).limit(1)
    const [row] = await testDb.db
      .insert(categories)
      .values({ isSystem: true, key, name: `Alt ${key}`, productGroupId: group?.id ?? '' })
      .returning({ id: categories.id })
    if (row === undefined) throw new Error(`${key} nicht angelegt`)
    return row.id
  }

  const productOn = async (foodType: { id: string; categoryId: string }) => {
    const product = buildProduct({
      householdId: basics.householdId,
      categoryId: foodType.categoryId,
      foodTypeId: foodType.id,
    })
    await testDb.db.insert(products).values(product)
    return product.id
  }

  const foodTypeByKey = async (key: string) => {
    const [row] = await testDb.db
      .select({ id: foodTypes.id, categoryId: foodTypes.categoryId, isHidden: foodTypes.isHidden })
      .from(foodTypes)
      .where(eq(foodTypes.key, key))
    return row
  }

  const categoryById = async (id: string) => {
    const [row] = await testDb.db
      .select({ isHidden: categories.isHidden })
      .from(categories)
      .where(eq(categories.id, id))
    return row
  }

  beforeAll(async () => {
    testDb = await createTestDb()
    basics = await insertBasics(testDb.db)
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('hängt Produkte einer zusammengelegten Art auf die neue Art um und löscht die alte', async () => {
    const productId = await productOn(await insertOldFoodType('spaghetti'))

    await seedMasterData(testDb.db)

    const noodles = await foodTypeByKey('nudeln')
    const [moved] = await testDb.db
      .select({ foodTypeId: products.foodTypeId, categoryId: products.categoryId })
      .from(products)
      .where(eq(products.id, productId))
    expect(moved).toEqual({ foodTypeId: noodles?.id, categoryId: noodles?.categoryId })
    expect(await foodTypeByKey('spaghetti')).toBeUndefined()
  })

  it('zieht beim Umhängen auch die Kategorie des Produkts mit (thunfisch)', async () => {
    const oldTuna = await insertOldFoodType('thunfisch')
    const productId = await productOn(oldTuna)

    await seedMasterData(testDb.db)

    const tuna = await foodTypeByKey('thunfisch_konserve')
    const [moved] = await testDb.db
      .select({ foodTypeId: products.foodTypeId, categoryId: products.categoryId })
      .from(products)
      .where(eq(products.id, productId))
    expect(tuna?.categoryId).not.toBe(oldTuna.categoryId)
    expect(moved).toEqual({ foodTypeId: tuna?.id, categoryId: tuna?.categoryId })
    expect(await foodTypeByKey('thunfisch')).toBeUndefined()
  })

  it('blendet eine entfallene, noch benutzte Art aus und löscht eine unbenutzte', async () => {
    await productOn(await insertOldFoodType('alte_benutzte_art'))
    await insertOldFoodType('alte_leere_art')

    await seedMasterData(testDb.db)

    expect((await foodTypeByKey('alte_benutzte_art'))?.isHidden).toBe(true)
    expect(await foodTypeByKey('alte_leere_art')).toBeUndefined()
  })

  it('blendet eine entfallene Kategorie mit Art aus und löscht eine leere', async () => {
    const usedCategoryId = await insertOldCategory('alte_benutzte_kategorie')
    await productOn(await insertOldFoodType('art_in_alter_kategorie', usedCategoryId))
    const emptyCategoryId = await insertOldCategory('alte_leere_kategorie')

    await seedMasterData(testDb.db)

    expect((await categoryById(usedCategoryId))?.isHidden).toBe(true)
    expect(await categoryById(emptyCategoryId)).toBeUndefined()
  })

  it('lässt neue Arten ohne belegte Richtwerte leer', async () => {
    const [bulgur] = await testDb.db
      .select({ kcal: foodTypes.kcalPer100, months: foodTypes.typicalShelfLifeMonths })
      .from(foodTypes)
      .where(eq(foodTypes.key, 'bulgur'))

    expect(bulgur).toEqual({ kcal: null, months: null })
  })
})
