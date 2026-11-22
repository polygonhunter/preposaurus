// Löschen eines Haushalts nimmt nie Daten eines anderen Haushalts mit (#133). Heikel ist die
// Kaskade über einheit.erfassung_id: Eine Einheit, die auf die Erfassung eines fremden Haushalts
// verweist, verschwände mit diesem. Deshalb prüft jeder Service die Bezüge beim Anlegen
// (prepareRecognition für Fotos, M5-01 für Einheit und Erfassung). Alle Werte sind erfunden.
import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  buildCapture,
  buildHousehold,
  buildProduct,
  buildUnit,
  buildUser,
} from '../../../db/seeds/factories'
import { seedMasterData } from '../../../db/seeds/master-data'
import type { Database } from '../../../src/server/db/connection'
import { users } from '../../../src/server/db/schema/account'
import { aiCalls, captureDrafts, photos } from '../../../src/server/db/schema/capture'
import { categories } from '../../../src/server/db/schema/catalog'
import { captures } from '../../../src/server/db/schema/confirmed-captures'
import { households } from '../../../src/server/db/schema/household'
import { products, units } from '../../../src/server/db/schema/inventory'
import { createTestDb, type TestDb } from '../../helpers/test-db'

async function insertHouseholdWithStock(db: Database, categoryId: string): Promise<string> {
  const household = buildHousehold()
  await db.insert(households).values(household)
  const householdId = household.id
  const user = buildUser({ householdId })
  await db.insert(users).values(user)
  const product = buildProduct({ householdId, categoryId })
  await db.insert(products).values(product)
  const capture = buildCapture({ householdId, userId: user.id })
  await db.insert(captures).values(capture)
  const unit = buildUnit({ productId: product.id, captureId: capture.id, bestBefore: '2027-05-31' })
  await db.insert(units).values(unit)
  const photoId = crypto.randomUUID()
  await db.insert(photos).values({
    id: photoId,
    householdId,
    role: 'mhd',
    path: `test/${photoId}.jpg`,
    mimeType: 'image/jpeg',
    status: 'fest',
    productId: product.id,
    unitId: unit.id,
  })
  await db.insert(aiCalls).values({ householdId, photoId, model: 'fake', isSuccess: true })
  await db.insert(captureDrafts).values({ householdId, userId: user.id })
  return householdId
}

const TABLES = { users, products, captures, units, photos, aiCalls, captureDrafts }

async function countRows(db: Database): Promise<Record<keyof typeof TABLES, number>> {
  const entries = await Promise.all(
    Object.entries(TABLES).map(async ([name, table]) => {
      const rows = await db.select().from(table)
      return [name, rows.length] as const
    }),
  )
  return Object.fromEntries(entries) as Record<keyof typeof TABLES, number>
}

describe('Haushalt löschen (#133)', () => {
  let testDb: TestDb
  let keptId: string
  let deletedId: string

  beforeAll(async () => {
    testDb = await createTestDb()
    await seedMasterData(testDb.db)
    const [category] = await testDb.db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.key, 'getreide'))
    if (category === undefined) throw new Error('System-Kategorie getreide fehlt')
    keptId = await insertHouseholdWithStock(testDb.db, category.id)
    deletedId = await insertHouseholdWithStock(testDb.db, category.id)
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('entfernt nur die Daten des gelöschten Haushalts', async () => {
    await testDb.db.delete(households).where(eq(households.id, deletedId))

    expect(await countRows(testDb.db)).toEqual({
      users: 1,
      products: 1,
      captures: 1,
      units: 1,
      photos: 1,
      aiCalls: 1,
      captureDrafts: 1,
    })
    const [kept] = await testDb.db.select({ householdId: products.householdId }).from(products)
    expect(kept?.householdId).toBe(keptId)
  })
})
