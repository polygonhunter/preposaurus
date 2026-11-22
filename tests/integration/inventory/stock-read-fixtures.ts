// Demo-Haushalt plus ein zweiter, fremder Haushalt für die Lese-Tests des Vorrats (#43). Der
// fremde Haushalt hat eigene Spaghetti, die im Demo-Haushalt nie auftauchen dürfen (#133).
import { eq } from 'drizzle-orm'
import { seedDemo } from '../../../db/seeds/demo'
import {
  buildCapture,
  buildHousehold,
  buildProduct,
  buildUnit,
  buildUser,
} from '../../../db/seeds/factories'
import { seedMasterData } from '../../../db/seeds/master-data'
import { createStockReadRepository } from '../../../src/features/inventory/data/stock-read-repository'
import type { Database } from '../../../src/server/db/connection'
import { users } from '../../../src/server/db/schema/account'
import { categories } from '../../../src/server/db/schema/catalog'
import { captures } from '../../../src/server/db/schema/confirmed-captures'
import { foodTypes } from '../../../src/server/db/schema/food-types'
import { households } from '../../../src/server/db/schema/household'
import { products, units } from '../../../src/server/db/schema/inventory'
import { toCalendarDay } from '../../../src/shared/lib/dates'

const SEED_DAY = new Date('2026-11-22T12:00:00Z')
export const today = toCalendarDay('2026-11-22')

async function idOf(db: Database, table: typeof categories | typeof foodTypes, key: string) {
  const [row] = await db.select({ id: table.id }).from(table).where(eq(table.key, key))
  if (row === undefined) throw new Error(`${key} fehlt`)
  return row.id
}

async function insertForeignHousehold(db: Database, noodlesId: string) {
  const household = buildHousehold({ name: 'Fremder Haushalt' })
  await db.insert(households).values(household)
  const user = buildUser({ householdId: household.id })
  await db.insert(users).values(user)
  const product = buildProduct({
    householdId: household.id,
    categoryId: await idOf(db, categories, 'getreide'),
    foodTypeId: noodlesId,
    name: 'Fremde Spaghetti',
  })
  await db.insert(products).values(product)
  const capture = buildCapture({ householdId: household.id, userId: user.id })
  await db.insert(captures).values(capture)
  await db
    .insert(units)
    .values([
      buildUnit({ productId: product.id, captureId: capture.id, bestBefore: '2026-11-24' }),
      buildUnit({ productId: product.id, captureId: capture.id, bestBefore: null }),
    ])
  return household.id
}

export async function setupStockRead(db: Database) {
  await seedMasterData(db)
  await seedDemo(db, SEED_DAY)
  const [demo] = await db.select({ id: households.id }).from(households)
  if (demo === undefined) throw new Error('Demo-Haushalt fehlt')
  const noodlesId = await idOf(db, foodTypes, 'nudeln')
  const foreignId = await insertForeignHousehold(db, noodlesId)
  return {
    reader: createStockReadRepository(db),
    householdId: demo.id,
    foreignId,
    noodlesId,
  }
}
