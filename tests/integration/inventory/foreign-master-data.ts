// Fremde *eigene* Stammdaten für den Mandantentest (Review zu #139): Der fremde Haushalt hat eine
// eigene Kategorie, eine eigene Lebensmittelart und einen eigenen Lagerort. Im Demo-Haushalt
// verweisen zwei absichtlich kaputte Produkte darauf, wie es ein Schreibfehler (#133) täte.
import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import {
  buildCapture,
  buildProduct,
  buildStorageLocation,
  buildUnit,
  buildUser,
} from '../../../db/seeds/factories'
import type { Database } from '../../../src/server/db/connection'
import { users } from '../../../src/server/db/schema/account'
import { categories, storageLocations } from '../../../src/server/db/schema/catalog'
import { captures } from '../../../src/server/db/schema/confirmed-captures'
import { foodTypes } from '../../../src/server/db/schema/food-types'
import { products, units } from '../../../src/server/db/schema/inventory'
import { productGroups } from '../../../src/server/db/schema/recommendation'

/** Jeder fremde Name enthält dieses Wort, damit ein Leck in jeder Ausgabe auffällt. */
export const SECRET = 'Geheim'

async function captureFor(db: Database, householdId: string) {
  const user = buildUser({ householdId })
  await db.insert(users).values(user)
  const capture = buildCapture({ householdId, userId: user.id })
  await db.insert(captures).values(capture)
  return capture.id
}

async function insertOwnMasterData(db: Database, householdId: string) {
  const [group] = await db
    .select({ id: productGroups.id })
    .from(productGroups)
    .where(eq(productGroups.key, 'getreide'))
  if (group === undefined) throw new Error('Warengruppe getreide fehlt')
  const category = { id: randomUUID(), householdId, name: `${SECRET}kategorie` }
  await db.insert(categories).values({ ...category, productGroupId: group.id })
  const foodType = { id: randomUUID(), householdId, key: 'eigen_geheimart', name: `${SECRET}art` }
  await db.insert(foodTypes).values({ ...foodType, categoryId: category.id })
  const location = buildStorageLocation({ householdId, name: `${SECRET}keller` })
  await db.insert(storageLocations).values(location)
  return { categoryId: category.id, foodTypeId: foodType.id, storageLocationId: location.id }
}

type ProductInput = Parameters<typeof buildProduct>[0]

async function insertWithUnit(db: Database, product: ProductInput, captureId: string) {
  const row = buildProduct(product)
  await db.insert(products).values(row)
  await db
    .insert(units)
    .values(buildUnit({ productId: row.id, captureId, bestBefore: '2026-12-01' }))
}

export async function insertForeignMasterData(
  db: Database,
  ids: { householdId: string; foreignId: string },
) {
  const own = await insertOwnMasterData(db, ids.foreignId)
  const foreignCapture = await captureFor(db, ids.foreignId)
  await insertWithUnit(
    db,
    { householdId: ids.foreignId, ...own, name: `${SECRET}nudeln` },
    foreignCapture,
  )
  const demoCapture = await captureFor(db, ids.householdId)
  const [demoCategory] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.key, 'getreide'))
  if (demoCategory === undefined) throw new Error('Kategorie getreide fehlt')
  // Kaputt: Kategorie und Art des fremden Haushalts
  await insertWithUnit(
    db,
    {
      householdId: ids.householdId,
      categoryId: own.categoryId,
      foodTypeId: own.foodTypeId,
      name: 'Kaputt 1',
    },
    demoCapture,
  )
  // Kaputt: Lagerort des fremden Haushalts
  await insertWithUnit(
    db,
    {
      householdId: ids.householdId,
      categoryId: demoCategory.id,
      storageLocationId: own.storageLocationId,
      name: 'Kaputt 2',
    },
    demoCapture,
  )
  return own
}
