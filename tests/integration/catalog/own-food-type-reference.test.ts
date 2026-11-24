// Eigene Lebensmittelarten mit Richtwerten und Reihenfolge gegen die DB (#243): Makros und übliche
// Haltbarkeit werden gespeichert und wirken im Vorrat wie die Richtwerte der Startliste (live
// gelesen, nie ins Produkt kopiert). Eigene Arten stehen in ihrer Kategorie vor den System-Arten
// und lassen sich nur im eigenen Haushalt sortieren.
import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildHousehold, buildProduct } from '../../../db/seeds/factories'
import {
  createFoodTypeRepository,
  type FoodTypeRepository,
} from '../../../src/features/catalog/data/food-type-repository'
import type { FoodTypeReference } from '../../../src/features/catalog/domain/category'
import { createStockReadRepository } from '../../../src/features/inventory/data/stock-read-repository'
import { resolveNutrition } from '../../../src/features/inventory/domain/resolve-nutrition'
import { categories } from '../../../src/server/db/schema/catalog'
import { foodTypes } from '../../../src/server/db/schema/food-types'
import { households } from '../../../src/server/db/schema/household'
import { products } from '../../../src/server/db/schema/inventory'
import { insertBasics, type Basics } from '../../helpers/db-fixtures'
import { createTestDb, type TestDb } from '../../helpers/test-db'

const REFERENCE: FoodTypeReference = {
  kcalPer100: 352,
  proteinPer100: 11.5,
  carbsPer100: 68,
  fatPer100: 2.5,
  typicalShelfLifeMonths: 18,
}

const NO_REFERENCE: FoodTypeReference = {
  kcalPer100: null,
  proteinPer100: null,
  carbsPer100: null,
  fatPer100: null,
  typicalShelfLifeMonths: null,
}

describe('Eigene Lebensmittelarten mit Richtwerten und Reihenfolge', () => {
  let testDb: TestDb
  let repository: FoodTypeRepository
  let basics: Basics
  let otherId: string
  let speltId: string
  let emmerId: string

  const create = async (name: string, reference = NO_REFERENCE, categoryId = basics.categoryId) => {
    const id = await repository.create(basics.householdId, {
      name,
      key: `eigen_${name.toLowerCase()}`,
      categoryId,
      searchTerms: [],
      ...reference,
    })
    if (id === null) throw new Error(`${name} fehlt`)
    return id
  }

  const ownOrder = async (householdId: string) =>
    (await repository.list(householdId))
      .filter((entry) => entry.categoryId === basics.categoryId)
      .map((entry) => entry.name)

  beforeAll(async () => {
    testDb = await createTestDb()
    repository = createFoodTypeRepository(testDb.db)
    basics = await insertBasics(testDb.db)
    const other = buildHousehold({ name: 'Fremder Haushalt' })
    await testDb.db.insert(households).values(other)
    otherId = other.id
    speltId = await create('Dinkelreis', REFERENCE)
    emmerId = await create('Emmer')
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('speichert Makros und übliche Haltbarkeit und liest sie zurück', async () => {
    const spelt = (await repository.list(basics.householdId)).find((entry) => entry.id === speltId)

    expect(spelt).toMatchObject(REFERENCE)
  })

  it('ändert die Richtwerte nur im eigenen Haushalt', async () => {
    const values = { name: 'Emmer', categoryId: basics.categoryId, searchTerms: [] }

    expect(await repository.update(otherId, emmerId, { ...values, ...REFERENCE })).toBe(false)
    expect(
      await repository.update(basics.householdId, emmerId, {
        ...values,
        ...NO_REFERENCE,
        fatPer100: 3,
      }),
    ).toBe(true)

    const emmer = (await repository.list(basics.householdId)).find((entry) => entry.id === emmerId)
    expect(emmer).toMatchObject({ ...NO_REFERENCE, fatPer100: 3 })
  })

  it('ergänzt im Vorrat fehlende Nährwerte aus den Richtwerten der eigenen Art', async () => {
    const product = buildProduct({
      householdId: basics.householdId,
      categoryId: basics.categoryId,
      foodTypeId: speltId,
      name: 'Dinkelreis',
      kcalPer100: null,
      nutritionSource: null,
    })
    await testDb.db.insert(products).values(product)

    const [loaded] = await createStockReadRepository(testDb.db).loadProducts(basics.householdId, {
      productIds: [product.id],
    })
    if (loaded === undefined) throw new Error('Produkt fehlt')
    const resolved = resolveNutrition(loaded.nutrition, loaded.foodType?.reference ?? null)

    expect(loaded.foodType?.typicalShelfLifeMonths).toBe(18)
    expect(resolved).toEqual({
      kcal: { value: 352, origin: 'reference' },
      protein: { value: 11.5, origin: 'reference' },
      carbs: { value: 68, origin: 'reference' },
      fat: { value: 2.5, origin: 'reference' },
    })
    const [stored] = await testDb.db
      .select({ protein: products.proteinPer100 })
      .from(products)
      .where(eq(products.id, product.id))
    expect(stored?.protein).toBeNull()
  })

  it('stellt eigene Arten vor die System-Arten, neue ans Ende der eigenen', async () => {
    const order = await ownOrder(basics.householdId)

    expect(order.slice(0, 2)).toEqual(['Dinkelreis', 'Emmer'])
    expect(order.length).toBeGreaterThan(2)
    expect(order.slice(2)).not.toContain('Emmer')
  })

  it('speichert eine neue Reihenfolge nur für eigene Arten des eigenen Haushalts', async () => {
    const [system] = await testDb.db
      .select({ id: foodTypes.id, sortOrder: foodTypes.sortOrder })
      .from(foodTypes)
      .where(eq(foodTypes.key, 'nudeln'))
    if (system === undefined) throw new Error('System-Art fehlt')

    await repository.saveOrder(otherId, [emmerId, speltId])
    expect((await ownOrder(basics.householdId)).slice(0, 2)).toEqual(['Dinkelreis', 'Emmer'])

    await repository.saveOrder(basics.householdId, [emmerId, speltId, system.id])
    expect((await ownOrder(basics.householdId)).slice(0, 2)).toEqual(['Emmer', 'Dinkelreis'])
    const [after] = await testDb.db
      .select({ sortOrder: foodTypes.sortOrder })
      .from(foodTypes)
      .where(eq(foodTypes.id, system.id))
    expect(after?.sortOrder).toBe(system.sortOrder)
  })

  it('hält eigene Arten vorn, auch wenn ihre Nummer größer ist als die der Startliste', async () => {
    await testDb.db.update(foodTypes).set({ sortOrder: 99_999 }).where(eq(foodTypes.id, speltId))

    expect((await ownOrder(basics.householdId)).slice(0, 2)).toEqual(['Emmer', 'Dinkelreis'])
  })

  it('setzt eine Art beim Wechsel der Kategorie ans Ende der eigenen Arten dort', async () => {
    const [flour] = await testDb.db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.key, 'mehl_griess'))
    if (flour === undefined) throw new Error('Kategorie mehl_griess fehlt')
    const first = await create('Wildreis', NO_REFERENCE, flour.id)

    await repository.update(basics.householdId, emmerId, {
      name: 'Emmer',
      categoryId: flour.id,
      searchTerms: [],
      ...NO_REFERENCE,
    })

    const inFlour = (await repository.list(basics.householdId))
      .filter((entry) => entry.categoryId === flour.id && !entry.isSystem)
      .map((entry) => entry.id)
    expect(inFlour).toEqual([first, emmerId])
  })
})
