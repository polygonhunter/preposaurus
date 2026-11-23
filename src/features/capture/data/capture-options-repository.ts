// Lesepfade des Erfassens (#52): Auswahllisten und Vorbelegung. Jede Abfrage filtert auf die
// haushalt_id (#133): Eigene Arten und Lagerorte nur aus dem eigenen Haushalt, System-Arten und
// Behälter (System-Stammdaten) für alle. Ausgeblendetes steht nicht zur Wahl (#126, #142).
import 'server-only'
import { and, asc, desc, eq } from 'drizzle-orm'
import type { Database } from '@/server/db/connection'
import { loadOwnSearchTerms } from '@/server/db/queries/own-search-terms'
import { categories, containers, storageLocations } from '@/server/db/schema/catalog'
import { captures } from '@/server/db/schema/confirmed-captures'
import { foodTypes } from '@/server/db/schema/food-types'
import { products, units } from '@/server/db/schema/inventory'
import { productGroups } from '@/server/db/schema/recommendation'
import type {
  ContainerChoice,
  FoodTypeChoice,
  LastUsed,
  NamedChoice,
} from '../domain/capture-options'
import { loadKnownProducts } from './known-products'
import { isSelectableFoodType } from './visible-food-types'

/** So viele Erfassungen reichen für „Zuletzt genutzt“ und den letzten Lagerort. */
const RECENT_CAPTURES = 20
const RECENT_FOOD_TYPES = 5

async function loadFoodTypes(db: Database, householdId: string): Promise<FoodTypeChoice[]> {
  const rows = await db
    .select({
      id: foodTypes.id,
      key: foodTypes.key,
      name: foodTypes.name,
      categoryName: categories.name,
      productGroupName: productGroups.name,
      kcalPer100: foodTypes.kcalPer100,
    })
    .from(foodTypes)
    .innerJoin(categories, eq(categories.id, foodTypes.categoryId))
    .innerJoin(productGroups, eq(productGroups.id, categories.productGroupId))
    .where(isSelectableFoodType(db, householdId))
    .orderBy(asc(productGroups.sortOrder), asc(foodTypes.name))
  const searchTerms = await loadOwnSearchTerms(db, householdId)
  return rows.map((row) => ({
    ...row,
    kcalPer100: row.kcalPer100 === null ? null : Number(row.kcalPer100),
    searchTerms: searchTerms.get(row.id) ?? [],
  }))
}

async function loadContainers(db: Database): Promise<ContainerChoice[]> {
  return db
    .select({ id: containers.id, key: containers.key, name: containers.name })
    .from(containers)
    .orderBy(asc(containers.sortOrder), asc(containers.name))
}

async function loadStorageLocations(db: Database, householdId: string): Promise<NamedChoice[]> {
  return db
    .select({ id: storageLocations.id, name: storageLocations.name })
    .from(storageLocations)
    .where(and(eq(storageLocations.householdId, householdId), eq(storageLocations.isHidden, false)))
    .orderBy(asc(storageLocations.sortOrder), asc(storageLocations.name))
}

/** Letzte Erfassungen des Nutzers mit dem Produkt, zu dem sie Packungen brachten. */
async function loadLastUsed(db: Database, householdId: string, userId: string): Promise<LastUsed> {
  const rows = await db
    .selectDistinct({
      createdAt: captures.createdAt,
      foodTypeId: products.foodTypeId,
      storageLocationId: products.storageLocationId,
    })
    .from(captures)
    .innerJoin(units, eq(units.captureId, captures.id))
    .innerJoin(
      products,
      and(eq(products.id, units.productId), eq(products.householdId, householdId)),
    )
    .where(and(eq(captures.householdId, householdId), eq(captures.userId, userId)))
    .orderBy(desc(captures.createdAt))
    .limit(RECENT_CAPTURES)
  const foodTypeIds = rows.flatMap((row) => (row.foodTypeId === null ? [] : [row.foodTypeId]))
  return {
    storageLocationId:
      rows.find((row) => row.storageLocationId !== null)?.storageLocationId ?? null,
    foodTypeIds: [...new Set(foodTypeIds)].slice(0, RECENT_FOOD_TYPES),
  }
}

async function hasStock(db: Database, householdId: string): Promise<boolean> {
  const rows = await db
    .select({ id: units.id })
    .from(units)
    .innerJoin(products, eq(products.id, units.productId))
    .where(and(eq(products.householdId, householdId), eq(units.status, 'vorrat')))
    .limit(1)
  return rows.length > 0
}

export function createCaptureOptionsRepository(db: Database) {
  return {
    loadFoodTypes: (householdId: string) => loadFoodTypes(db, householdId),
    loadContainers: () => loadContainers(db),
    loadStorageLocations: (householdId: string) => loadStorageLocations(db, householdId),
    loadKnownProducts: (householdId: string) => loadKnownProducts(db, householdId),
    loadLastUsed: (householdId: string, userId: string) => loadLastUsed(db, householdId, userId),
    hasStock: (householdId: string) => hasStock(db, householdId),
  }
}
