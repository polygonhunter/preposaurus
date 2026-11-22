// Beispielhaushalt für Entwicklung und E2E (UMSETZUNG M1-10). Läuft nur von Hand
// (npm run db:seed:demo), nie automatisch im Container. Braucht die Stammdaten.
import type { Database } from '../../src/server/db/connection'
import { users } from '../../src/server/db/schema/account'
import { categories, containers, storageLocations } from '../../src/server/db/schema/catalog'
import { foodTypes } from '../../src/server/db/schema/food-types'
import { householdSettings, households, members } from '../../src/server/db/schema/household'
import { products, units } from '../../src/server/db/schema/inventory'
import { goals } from '../../src/server/db/schema/recommendation'
import { restockItems } from '../../src/server/db/schema/restock'
import {
  AMPEL_OFFSETS,
  buildGoal,
  buildHousehold,
  buildHouseholdSettings,
  buildMember,
  buildProduct,
  buildRestockItem,
  buildStorageLocation,
  buildUnit,
  buildUser,
  daysFrom,
} from '../../tests/helpers/factories'
import { DEMO_MEMBERS, DEMO_PRODUCTS, DEMO_USERS, type DemoProduct } from './demo-data'

type Lookups = Readonly<{
  categoryIds: Map<string, string>
  containerIds: Map<string, string>
  foodTypeIds: Map<string, string>
  locationIds: Map<string, string>
}>

// Was jeder Schritt der Demo braucht: Verbindung bzw. Transaktion, Haushalt und Stichtag.
type DemoContext = Readonly<{ db: Database; householdId: string; today: Date }>

const GOAL_HORIZON_DAYS = 40

function requireId(ids: Map<string, string>, key: string): string {
  const found = ids.get(key)
  if (found === undefined) throw new Error(`${key} fehlt. Zuerst npm run db:seed ausführen.`)
  return found
}

async function loadMasterDataIds(db: Database) {
  const categoryRows = await db.select({ id: categories.id, key: categories.key }).from(categories)
  const containerRows = await db.select({ id: containers.id, key: containers.key }).from(containers)
  const foodTypeRows = await db.select({ id: foodTypes.id, key: foodTypes.key }).from(foodTypes)
  return {
    foodTypeIds: new Map(foodTypeRows.map((row) => [row.key ?? '', row.id])),
    categoryIds: new Map(categoryRows.map((row) => [row.key ?? '', row.id])),
    containerIds: new Map(containerRows.map((row) => [row.key, row.id])),
  }
}

async function insertPeople(db: Database, householdId: string): Promise<string> {
  const memberRows = DEMO_MEMBERS.map((member) => buildMember({ householdId, ...member }))
  await db.insert(members).values(memberRows)
  const memberIds = new Map(memberRows.map((row) => [row.name, row.id]))
  const userRows = DEMO_USERS.map(({ member, ...user }) =>
    buildUser({ householdId, ...user, memberId: requireId(memberIds, member) }),
  )
  await db.insert(users).values(userRows)
  return userRows[0]?.id ?? ''
}

async function insertLocations(db: Database, householdId: string) {
  const rows = ['Keller', 'Küche'].map((name, index) =>
    buildStorageLocation({ householdId, name, sortOrder: index }),
  )
  await db.insert(storageLocations).values(rows)
  return new Map(rows.map((row) => [row.name, row.id]))
}

function buildDemoProduct(item: DemoProduct, householdId: string, lookups: Lookups) {
  const { units: stages, category, foodType, container, location, ...fields } = item
  return {
    product: buildProduct({
      householdId,
      ...fields,
      categoryId: requireId(lookups.categoryIds, category),
      foodTypeId: foodType === undefined ? null : requireId(lookups.foodTypeIds, foodType),
      containerId: requireId(lookups.containerIds, container),
      storageLocationId: requireId(lookups.locationIds, location),
    }),
    stages,
  }
}

async function insertStock({ db, householdId, today }: DemoContext, lookups: Lookups) {
  const built = DEMO_PRODUCTS.map((item) => buildDemoProduct(item, householdId, lookups))
  await db.insert(products).values(built.map(({ product }) => product))
  const unitRows = built.flatMap(({ product, stages }) =>
    stages.map((stage) =>
      buildUnit({ productId: product.id, bestBefore: daysFrom(today, AMPEL_OFFSETS[stage]) }),
    ),
  )
  await db.insert(units).values(unitRows)
  return built[0]?.product.id ?? ''
}

// Je eine verbrauchte und eine entsorgte Einheit, damit Historie und Statistik etwas zeigen.
async function insertHistory({ db, today }: DemoContext, productId: string, takenBy: string) {
  const takenAt = new Date(today.getTime())
  await db.insert(units).values([
    buildUnit({
      productId,
      bestBefore: daysFrom(today, 30),
      status: 'verbraucht',
      takenAt,
      takenBy,
    }),
    buildUnit({
      productId,
      bestBefore: daysFrom(today, -10),
      status: 'entsorgt',
      takenAt,
      takenBy,
    }),
  ])
}

async function insertHousehold(db: Database, today: Date): Promise<string> {
  const household = buildHousehold()
  await db.insert(households).values(household)
  await db.insert(householdSettings).values(buildHouseholdSettings({ householdId: household.id }))
  await db
    .insert(goals)
    .values(
      buildGoal({ householdId: household.id, targetDate: daysFrom(today, GOAL_HORIZON_DAYS) }),
    )
  return household.id
}

// Gibt false zurück, wenn schon ein Haushalt existiert: Die Demo überschreibt nie echte Daten.
export async function seedDemo(db: Database, today: Date): Promise<boolean> {
  const existing = await db.select({ id: households.id }).from(households).limit(1)
  if (existing.length > 0) return false
  await db.transaction(async (tx) => {
    const masterData = await loadMasterDataIds(tx)
    const householdId = await insertHousehold(tx, today)
    const adminId = await insertPeople(tx, householdId)
    const locationIds = await insertLocations(tx, householdId)
    const context = { db: tx, householdId, today }
    const productId = await insertStock(context, { ...masterData, locationIds })
    await insertHistory(context, productId, adminId)
    await tx.insert(restockItems).values(buildRestockItem({ householdId }))
  })
  return true
}
