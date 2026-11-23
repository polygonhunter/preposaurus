// Kategorien und Lebensmittelarten gegen die DB (#76, #126): Mandantenfilter, System-Einträge nur
// je Haushalt ausblendbar und nie löschbar, Löschen nur ohne Nutzung, eigene Suchwörter. Dazu die
// Erfassen-Suche und das KI-Enum: Ausgeblendetes steht dort nicht mehr zur Wahl.
import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildHousehold, buildProduct } from '../../../db/seeds/factories'
import { createCaptureOptionsRepository } from '../../../src/features/capture/data/capture-options-repository'
import { loadFoodTypeOptions } from '../../../src/features/capture/data/food-type-options'
import {
  createCategoryRepository,
  type CategoryRepository,
} from '../../../src/features/catalog/data/category-repository'
import {
  createFoodTypeRepository,
  type FoodTypeRepository,
} from '../../../src/features/catalog/data/food-type-repository'
import { categories } from '../../../src/server/db/schema/catalog'
import { foodTypes } from '../../../src/server/db/schema/food-types'
import { households } from '../../../src/server/db/schema/household'
import { products } from '../../../src/server/db/schema/inventory'
import { insertBasics, type Basics } from '../../helpers/db-fixtures'
import { createTestDb, type TestDb } from '../../helpers/test-db'

describe('Kategorien und Lebensmittelarten in der Datenbank', () => {
  let testDb: TestDb
  let categoryRepository: CategoryRepository
  let foodTypeRepository: FoodTypeRepository
  let basics: Basics
  let otherId: string
  let groupId: string
  let noodlesId: string

  beforeAll(async () => {
    testDb = await createTestDb()
    categoryRepository = createCategoryRepository(testDb.db)
    foodTypeRepository = createFoodTypeRepository(testDb.db)
    basics = await insertBasics(testDb.db)
    const other = buildHousehold({ name: 'Fremder Haushalt' })
    await testDb.db.insert(households).values(other)
    otherId = other.id
    const [group] = await categoryRepository.listGroups()
    if (group === undefined) throw new Error('Warengruppe fehlt')
    groupId = group.id
    const [noodles] = await testDb.db
      .select({ id: foodTypes.id })
      .from(foodTypes)
      .where(eq(foodTypes.key, 'nudeln'))
    if (noodles === undefined) throw new Error('System-Art nudeln fehlt')
    noodlesId = noodles.id
  })

  afterAll(async () => {
    await testDb.close()
  })

  const captureKeys = async (householdId: string) =>
    (await createCaptureOptionsRepository(testDb.db).loadFoodTypes(householdId)).map(
      (choice) => choice.key,
    )

  const aiKeys = async (householdId: string) =>
    (await loadFoodTypeOptions(testDb.db, householdId)).map((option) => option.key)

  it('legt eigene Kategorien an, die nur der eigene Haushalt sieht und ändert', async () => {
    const id = await categoryRepository.create(basics.householdId, {
      name: 'Vorratsdosen',
      productGroupId: groupId,
    })
    if (id === null) throw new Error('Kategorie fehlt')

    const own = await categoryRepository.list(basics.householdId)
    const foreign = await categoryRepository.list(otherId)
    expect(own.find((entry) => entry.id === id)).toMatchObject({ isSystem: false, isHidden: false })
    expect(foreign.some((entry) => entry.id === id)).toBe(false)
    expect(
      await categoryRepository.update(otherId, id, { name: 'X', productGroupId: groupId }),
    ).toBe(false)
    expect(await categoryRepository.remove(otherId, id)).toBe('not-found')
    expect(
      await categoryRepository.create(otherId, { name: 'Vorratsdosen', productGroupId: groupId }),
    ).not.toBeNull()
  })

  it('ändert und löscht keine System-Kategorie', async () => {
    expect(
      await categoryRepository.update(basics.householdId, basics.categoryId, {
        name: 'Anders',
        productGroupId: groupId,
      }),
    ).toBe(false)
    expect(await categoryRepository.remove(basics.householdId, basics.categoryId)).toBe('not-found')
  })

  it('blendet eine System-Kategorie nur für den eigenen Haushalt aus', async () => {
    const [category] = await testDb.db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, basics.categoryId))
    if (category === undefined) throw new Error('Kategorie fehlt')
    expect(await captureKeys(basics.householdId)).toContain('nudeln')

    await categoryRepository.setHidden(basics.householdId, category.id, true)

    const own = await categoryRepository.list(basics.householdId)
    const foreign = await categoryRepository.list(otherId)
    expect(own.find((entry) => entry.id === category.id)?.isHidden).toBe(true)
    expect(foreign.find((entry) => entry.id === category.id)?.isHidden).toBe(false)
    expect(await captureKeys(basics.householdId)).not.toContain('nudeln')
    expect(await aiKeys(basics.householdId)).not.toContain('nudeln')
    expect(await captureKeys(otherId)).toContain('nudeln')

    await categoryRepository.setHidden(basics.householdId, category.id, false)
    expect(await captureKeys(basics.householdId)).toContain('nudeln')
  })

  it('legt eine eigene Art mit Suchwörtern an, die Erfassen und KI anbieten', async () => {
    const id = await foodTypeRepository.create(basics.householdId, {
      name: 'Dinkelpops',
      key: 'eigen_dinkelpops',
      categoryId: basics.categoryId,
      searchTerms: ['Knusperflocken', 'Pops'],
      kcalPer100: 380,
    })
    if (id === null) throw new Error('Art fehlt')

    const choices = await createCaptureOptionsRepository(testDb.db).loadFoodTypes(
      basics.householdId,
    )
    expect(choices.find((choice) => choice.id === id)).toMatchObject({
      searchTerms: ['Knusperflocken', 'Pops'],
      kcalPer100: 380,
    })
    expect(await aiKeys(basics.householdId)).toContain('eigen_dinkelpops')
    expect(await captureKeys(otherId)).not.toContain('eigen_dinkelpops')
    expect(
      await foodTypeRepository.update(otherId, id, {
        name: 'X',
        categoryId: basics.categoryId,
        searchTerms: [],
        kcalPer100: null,
      }),
    ).toBe(false)
  })

  it('ersetzt die Suchwörter beim Ändern als Ganzes', async () => {
    const own = (await foodTypeRepository.list(basics.householdId)).find(
      (entry) => entry.key === 'eigen_dinkelpops',
    )
    if (own === undefined) throw new Error('Art fehlt')

    await foodTypeRepository.update(basics.householdId, own.id, {
      name: 'Dinkelpops',
      categoryId: basics.categoryId,
      searchTerms: ['Frühstück'],
      kcalPer100: null,
    })

    const after = (await foodTypeRepository.list(basics.householdId)).find(
      (entry) => entry.id === own.id,
    )
    expect(after).toMatchObject({ searchTerms: ['Frühstück'], kcalPer100: null })
  })

  it('blendet eine System-Art je Haushalt aus, Erfassen und KI bieten sie nicht mehr an', async () => {
    await foodTypeRepository.setHidden(basics.householdId, noodlesId, true)

    const own = await foodTypeRepository.list(basics.householdId)
    expect(own.find((entry) => entry.id === noodlesId)?.isHidden).toBe(true)
    expect(await captureKeys(basics.householdId)).not.toContain('nudeln')
    expect(await aiKeys(basics.householdId)).not.toContain('nudeln')
    expect(await captureKeys(otherId)).toContain('nudeln')
    await foodTypeRepository.setHidden(basics.householdId, noodlesId, false)
  })

  it('löscht keine System-Art und keine benutzte eigene Art, eine unbenutzte schon', async () => {
    const own = (await foodTypeRepository.list(basics.householdId)).find(
      (entry) => entry.key === 'eigen_dinkelpops',
    )
    if (own === undefined) throw new Error('Art fehlt')
    const product = buildProduct({
      householdId: basics.householdId,
      categoryId: basics.categoryId,
      foodTypeId: own.id,
    })
    await testDb.db.insert(products).values(product)

    expect(await foodTypeRepository.remove(basics.householdId, noodlesId)).toBe('not-found')
    expect(await foodTypeRepository.remove(basics.householdId, own.id)).toBe('in-use')
    await testDb.db.delete(products).where(eq(products.id, product.id))
    expect(await foodTypeRepository.remove(basics.householdId, own.id)).toBe('removed')
  })

  it('löscht eine eigene Kategorie nur ohne Arten', async () => {
    const id = await categoryRepository.create(basics.householdId, {
      name: 'Mit Art',
      productGroupId: groupId,
    })
    if (id === null) throw new Error('Kategorie fehlt')
    const typeId = await foodTypeRepository.create(basics.householdId, {
      name: 'Testart',
      key: 'eigen_testart',
      categoryId: id,
      searchTerms: [],
      kcalPer100: null,
    })
    if (typeId === null) throw new Error('Art fehlt')

    expect(await categoryRepository.remove(basics.householdId, id)).toBe('in-use')
    await foodTypeRepository.remove(basics.householdId, typeId)
    expect(await categoryRepository.remove(basics.householdId, id)).toBe('removed')
  })

  it('nimmt Produkte mit, wenn eine eigene Art die Kategorie wechselt', async () => {
    const target = await categoryRepository.create(basics.householdId, {
      name: 'Ziel',
      productGroupId: groupId,
    })
    const typeId = await foodTypeRepository.create(basics.householdId, {
      name: 'Wandernde Art',
      key: 'eigen_wandernd',
      categoryId: basics.categoryId,
      searchTerms: [],
      kcalPer100: null,
    })
    if (target === null || typeId === null) throw new Error('Einträge fehlen')
    const product = buildProduct({
      householdId: basics.householdId,
      categoryId: basics.categoryId,
      foodTypeId: typeId,
    })
    await testDb.db.insert(products).values(product)

    await foodTypeRepository.update(basics.householdId, typeId, {
      name: 'Wandernde Art',
      categoryId: target,
      searchTerms: [],
      kcalPer100: null,
    })

    const [moved] = await testDb.db
      .select({ categoryId: products.categoryId })
      .from(products)
      .where(eq(products.id, product.id))
    expect(moved?.categoryId).toBe(target)
  })
})
