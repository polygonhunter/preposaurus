import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildProduct, buildUnit } from '../../../db/seeds/factories'
import { photos } from '../../../src/server/db/schema/capture'
import { categories } from '../../../src/server/db/schema/catalog'
import { foodTypes } from '../../../src/server/db/schema/food-types'
import { households } from '../../../src/server/db/schema/household'
import { products, units } from '../../../src/server/db/schema/inventory'
import { expectConstraintViolation } from '../../helpers/db-errors'
import { insertBasics, type Basics } from '../../helpers/db-fixtures'
import { createTestDb, type TestDb } from '../../helpers/test-db'

describe('Integrität über Tabellen hinweg', () => {
  let testDb: TestDb
  let basics: Basics

  const ownCategory = (name: string) => ({
    householdId: basics.householdId,
    name,
    productGroupId: '',
  })

  const groupIdOf = async (categoryId: string) => {
    const [row] = await testDb.db
      .select({ groupId: categories.productGroupId })
      .from(categories)
      .where(eq(categories.id, categoryId))
    return row?.groupId ?? ''
  }

  beforeAll(async () => {
    testDb = await createTestDb()
    basics = await insertBasics(testDb.db)
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('kennt entnommen_von nur bei verbrauchten oder entsorgten Einheiten', async () => {
    await expectConstraintViolation(
      testDb.db
        .insert(units)
        .values(buildUnit({ productId: basics.productId, takenBy: basics.userId })),
      'einheit_entnommen_von_check',
    )
  })

  it('lehnt eine eigene Kategorie mit doppeltem Namen im selben Haushalt ab', async () => {
    const category = {
      ...ownCategory('Backzutaten'),
      productGroupId: await groupIdOf(basics.categoryId),
    }
    await testDb.db.insert(categories).values(category)

    await expectConstraintViolation(
      testDb.db.insert(categories).values(category),
      'kategorie_name_eindeutig',
    )
  })

  it('lehnt ein MHD-Foto ab, dessen Einheit zu einem anderen Produkt gehört', async () => {
    const other = buildProduct({ householdId: basics.householdId, categoryId: basics.categoryId })
    await testDb.db.insert(products).values(other)
    const foreignUnit = buildUnit({ productId: other.id, bestBefore: '2027-01-31' })
    await testDb.db.insert(units).values(foreignUnit)

    await expectConstraintViolation(
      testDb.db.insert(photos).values({
        householdId: basics.householdId,
        role: 'mhd',
        path: 'fotos/fremde-einheit.jpg',
        hash: 'sha256-test',
        sizeBytes: 1024,
        mimeType: 'image/jpeg',
        productId: basics.productId,
        unitId: foreignUnit.id,
      }),
      'foto_einheit_produkt_fk',
    )
  })

  it('löscht einen Haushalt samt eigener Kategorie, eigener Art und Produkten', async () => {
    const groupId = await groupIdOf(basics.categoryId)
    const [category] = await testDb.db
      .insert(categories)
      .values({ ...ownCategory('Vorrat Keller'), productGroupId: groupId })
      .returning()
    const categoryId = category?.id ?? ''
    const [foodType] = await testDb.db
      .insert(foodTypes)
      .values({
        householdId: basics.householdId,
        key: 'eigen_kellerbrot',
        name: 'Kellerbrot',
        categoryId,
      })
      .returning()
    await testDb.db.insert(products).values(
      buildProduct({
        householdId: basics.householdId,
        categoryId,
        foodTypeId: foodType?.id ?? null,
      }),
    )

    await testDb.db.delete(households).where(eq(households.id, basics.householdId))

    expect(await testDb.db.select().from(products)).toEqual([])
    expect(await testDb.db.select().from(foodTypes).where(eq(foodTypes.isSystem, false))).toEqual(
      [],
    )
  })
})
