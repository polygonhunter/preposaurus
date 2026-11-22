import { asc, eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { seedMasterData } from '../../../db/seeds/master-data'
import { categories, containers } from '../../../src/server/db/schema/catalog'
import { productGroups } from '../../../src/server/db/schema/recommendation'
import { createTestDb, type TestDb } from '../../helpers/test-db'

describe('Seed Stammdaten', () => {
  let testDb: TestDb

  const snapshot = async () => ({
    groups: await testDb.db
      .select({ id: productGroups.id, key: productGroups.key, name: productGroups.name })
      .from(productGroups)
      .orderBy(asc(productGroups.key)),
    categories: await testDb.db
      .select({
        id: categories.id,
        key: categories.key,
        groupId: categories.productGroupId,
        isHidden: categories.isHidden,
      })
      .from(categories)
      .orderBy(asc(categories.key)),
    containers: await testDb.db
      .select({ id: containers.id, key: containers.key })
      .from(containers)
      .orderBy(asc(containers.key)),
  })

  beforeAll(async () => {
    testDb = await createTestDb()
    await seedMasterData(testDb.db)
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('ergibt nach zweimaligem Seed denselben Stand', async () => {
    const first = await snapshot()

    await seedMasterData(testDb.db)

    expect(await snapshot()).toEqual(first)
  })

  it('legt Wasser als eigene Kategorie in der eigenen Warengruppe an', async () => {
    const [water] = await testDb.db
      .select({ groupKey: productGroups.key })
      .from(categories)
      .innerJoin(productGroups, eq(categories.productGroupId, productGroups.id))
      .where(eq(categories.key, 'wasser'))

    expect(water).toEqual({ groupKey: 'wasser' })
  })

  it('ordnet jede System-Kategorie einer Warengruppe zu und legt Behälter an', async () => {
    const { categories: seeded, containers: seededContainers } = await snapshot()

    expect(seeded.length).toBeGreaterThan(0)
    expect(seeded.every((category) => category.groupId !== '')).toBe(true)
    expect(seededContainers.map((container) => container.key)).toContain('dose')
  })

  it('lässt eine ausgeblendete System-Kategorie beim erneuten Seed ausgeblendet', async () => {
    await testDb.db
      .update(categories)
      .set({ isHidden: true })
      .where(eq(categories.key, 'getraenke'))

    await seedMasterData(testDb.db)

    const [drinks] = await testDb.db
      .select({ isHidden: categories.isHidden })
      .from(categories)
      .where(eq(categories.key, 'getraenke'))
    expect(drinks?.isHidden).toBe(true)
  })
})
