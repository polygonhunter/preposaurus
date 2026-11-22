// Beispielhaushalt für Entwicklung und E2E (UMSETZUNG M1-10). Läuft nur von Hand
// (npm run db:seed:demo), nie automatisch im Container. Braucht die Stammdaten.
import { eq } from 'drizzle-orm'
import type { Database } from '../../src/server/db/connection'
import { users } from '../../src/server/db/schema/account'
import { categories, containers, storageLocations } from '../../src/server/db/schema/catalog'
import { captures } from '../../src/server/db/schema/confirmed-captures'
import { foodTypes } from '../../src/server/db/schema/food-types'
import { householdSettings, households, members } from '../../src/server/db/schema/household'
import { products, units } from '../../src/server/db/schema/inventory'
import { goals } from '../../src/server/db/schema/recommendation'
import { restockItems } from '../../src/server/db/schema/restock'
import {
  bestBeforeFor,
  buildCapture,
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
} from './factories'
import { DEMO_MEMBERS, DEMO_PRODUCTS, DEMO_USERS, type DemoProduct } from './demo-data'

type Lookups = Readonly<{
  categoryIds: Map<string, string>
  containerIds: Map<string, string>
  foodTypeIds: Map<string, string>
  locationIds: Map<string, string>
}>

// Was jeder Schritt der Demo braucht: Verbindung bzw. Transaktion, Haushalt, Stichtag und wer erfasst.
type DemoContext = Readonly<{ db: Database; householdId: string; today: Date; userId: string }>

const GOAL_HORIZON_DAYS = 40

function requireId(ids: Map<string, string>, key: string): string {
  const found = ids.get(key)
  if (found === undefined) throw new Error(`${key} fehlt. Zuerst npm run db:seed ausführen.`)
  return found
}

async function loadMasterDataIds(db: Database) {
  const categoryRows = await db.select({ id: categories.id, key: categories.key }).from(categories)
  const containerRows = await db.select({ id: containers.id, key: containers.key }).from(containers)
  const foodTypeRows = await db
    .select({ id: foodTypes.id, key: foodTypes.key })
    .from(foodTypes)
    .where(eq(foodTypes.isSystem, true))
  return {
    foodTypeIds: new Map(foodTypeRows.map((row) => [row.key, row.id])),
    categoryIds: new Map(categoryRows.map((row) => [row.key ?? '', row.id])),
    containerIds: new Map(containerRows.map((row) => [row.key, row.id])),
  }
}

async function insertMembers(db: Database, householdId: string): Promise<Map<string, string>> {
  const memberRows = DEMO_MEMBERS.map((member) => buildMember({ householdId, ...member }))
  await db.insert(members).values(memberRows)
  return new Map(memberRows.map((row) => [row.name, row.id]))
}

async function insertUsers(db: Database, householdId: string, memberIds: Map<string, string>) {
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
  const { units: stages, category, foodType, container, location, kcalPer100, ...fields } = item
  return {
    product: buildProduct({
      householdId,
      ...fields,
      kcalPer100: kcalPer100 ?? null,
      nutritionSource: kcalPer100 === undefined ? null : 'tabelle',
      categoryId: requireId(lookups.categoryIds, category),
      foodTypeId: foodType === undefined ? null : requireId(lookups.foodTypeIds, foodType),
      containerId: requireId(lookups.containerIds, container),
      storageLocationId: requireId(lookups.locationIds, location),
    }),
    stages,
  }
}

// Jedes Produkt kam mit einer eigenen Erfassung dazu, abwechselnd per Foto und von Hand.
async function insertStock(context: DemoContext, lookups: Lookups) {
  const { db, householdId, today, userId } = context
  const built = DEMO_PRODUCTS.map((item, index) => ({
    ...buildDemoProduct(item, householdId, lookups),
    capture: buildCapture({ householdId, userId, method: index % 2 === 0 ? 'foto' : 'manuell' }),
  }))
  await db.insert(products).values(built.map(({ product }) => product))
  await db.insert(captures).values(built.map(({ capture }) => capture))
  const unitRows = built.flatMap(({ product, stages, capture }) =>
    stages.map((stage) =>
      buildUnit({
        productId: product.id,
        captureId: capture.id,
        bestBefore: bestBeforeFor(stage, today),
      }),
    ),
  )
  await db.insert(units).values(unitRows)
  return built[0]?.product.id ?? ''
}

// Je eine verbrauchte und eine entsorgte Einheit, damit Historie und Statistik etwas zeigen.
async function insertHistory({ db, householdId, today, userId }: DemoContext, productId: string) {
  const takenAt = new Date(today.getTime())
  const capture = buildCapture({ householdId, userId })
  await db.insert(captures).values(capture)
  const taken = { productId, captureId: capture.id, takenAt, takenBy: userId }
  await db
    .insert(units)
    .values([
      buildUnit({ ...taken, bestBefore: daysFrom(today, 30), status: 'verbraucht' }),
      buildUnit({ ...taken, bestBefore: daysFrom(today, -10), status: 'entsorgt' }),
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

type HouseholdTarget = Readonly<{ householdId: string; userId: string; today: Date }>

// Personen, Lagerorte, Vorrat und Historie in einen bestehenden Haushalt. Für seedDemo und für die
// E2E-Tests, die den Haushalt vorher über die Ersteinrichtung anlegen (tests/e2e/beispielvorrat.setup.ts).
async function insertHouseholdData(tx: Database, target: HouseholdTarget) {
  const masterData = await loadMasterDataIds(tx)
  const locationIds = await insertLocations(tx, target.householdId)
  const context = { db: tx, ...target }
  const productId = await insertStock(context, { ...masterData, locationIds })
  await insertHistory(context, productId)
  await tx.insert(restockItems).values(buildRestockItem({ householdId: target.householdId }))
}

// Gibt false zurück, wenn schon ein Haushalt existiert: Die Demo überschreibt nie echte Daten.
export async function seedDemo(db: Database, today: Date): Promise<boolean> {
  const existing = await db.select({ id: households.id }).from(households).limit(1)
  if (existing.length > 0) return false
  await db.transaction(async (tx) => {
    const householdId = await insertHousehold(tx, today)
    const adminId = await insertUsers(tx, householdId, await insertMembers(tx, householdId))
    await insertHouseholdData(tx, { householdId, userId: adminId, today })
  })
  return true
}

// Gibt false zurück, wenn der Haushalt schon Produkte hat: Die Demo überschreibt nie echte Daten.
export async function seedDemoIntoHousehold(db: Database, target: HouseholdTarget) {
  return db.transaction(async (tx) => {
    const existing = await tx
      .select({ id: products.id })
      .from(products)
      .where(eq(products.householdId, target.householdId))
      .limit(1)
    if (existing.length > 0) return false
    await insertMembers(tx, target.householdId)
    await insertHouseholdData(tx, target)
    return true
  })
}
