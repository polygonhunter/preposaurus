// Zwei Haushalte für die Integrationstests des Speicherns (#51): der eigene mit Lagerort, der fremde
// mit eigener Lebensmittelart und eigenem Lagerort, die im eigenen Haushalt nie gelten dürfen.
import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { buildHousehold, buildStorageLocation, buildUser } from '../../../db/seeds/factories'
import type { Database } from '../../../src/server/db/connection'
import { users } from '../../../src/server/db/schema/account'
import { categories, containers, storageLocations } from '../../../src/server/db/schema/catalog'
import { foodTypes } from '../../../src/server/db/schema/food-types'
import { households } from '../../../src/server/db/schema/household'
import { insertBasics } from '../../helpers/db-fixtures'

async function idByKey(db: Database, table: typeof foodTypes | typeof containers, key: string) {
  const [row] = await db.select({ id: table.id }).from(table).where(eq(table.key, key))
  if (row === undefined) throw new Error(`${key} fehlt`)
  return row.id
}

async function insertForeignHousehold(db: Database, categoryId: string) {
  const household = buildHousehold({ name: 'Fremder Haushalt' })
  await db.insert(households).values(household)
  const user = buildUser({ householdId: household.id })
  await db.insert(users).values(user)
  const location = buildStorageLocation({ householdId: household.id, name: 'Fremder Keller' })
  await db.insert(storageLocations).values(location)
  const foodType = { id: randomUUID(), householdId: household.id, key: 'eigen_fremd', categoryId }
  await db.insert(foodTypes).values({ ...foodType, name: 'Fremde Art' })
  return {
    householdId: household.id,
    userId: user.id,
    storageLocationId: location.id,
    foodTypeId: foodType.id,
  }
}

export async function setupCreateStock(db: Database) {
  const basics = await insertBasics(db)
  const location = buildStorageLocation({ householdId: basics.householdId })
  await db.insert(storageLocations).values(location)
  const [noodlesCategory] = await db
    .select({ id: categories.id })
    .from(categories)
    .innerJoin(foodTypes, eq(foodTypes.categoryId, categories.id))
    .where(eq(foodTypes.key, 'nudeln'))
  if (noodlesCategory === undefined) throw new Error('Kategorie der Nudeln fehlt')
  return {
    householdId: basics.householdId,
    userId: basics.userId,
    storageLocationId: location.id,
    noodlesId: await idByKey(db, foodTypes, 'nudeln'),
    noodlesCategoryId: noodlesCategory.id,
    packageId: await idByKey(db, containers, 'packung'),
    foreign: await insertForeignHousehold(db, noodlesCategory.id),
  }
}

export type CreateStockSetup = Awaited<ReturnType<typeof setupCreateStock>>
