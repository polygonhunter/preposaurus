// Kategorien in der Verwaltung (#76): System-Kategorien und eigene des Haushalts. Jede Abfrage
// filtert auf den Haushalt, eine fremde eigene Kategorie findet also nichts. Ändern und Löschen
// treffen nur eigene Kategorien; gelöscht wird in einer Anweisung nur ohne Arten und Produkte.
import 'server-only'
import { and, asc, eq, isNull, notExists, or, sql } from 'drizzle-orm'
import type { CategoryEntry, ProductGroup } from '@/features/catalog/domain/category'
import type { Database } from '@/server/db/connection'
import { categories } from '@/server/db/schema/catalog'
import { foodTypes } from '@/server/db/schema/food-types'
import { products } from '@/server/db/schema/inventory'
import { productGroups } from '@/server/db/schema/recommendation'
import { categoryHiddenBy, setCategoryHidden } from './catalog-hiding'
import type { RemoveOutcome } from './remove-outcome'

type CategoryValues = Readonly<{ name: string; productGroupId: string }>

export interface CategoryRepository {
  listGroups: () => Promise<ProductGroup[]>
  list: (householdId: string) => Promise<CategoryEntry[]>
  /** null, wenn der Name schon vergeben ist */
  create: (householdId: string, values: CategoryValues) => Promise<string | null>
  /** Nur eigene Kategorien; false, wenn es keine eigene mit dieser ID gibt */
  update: (householdId: string, id: string, values: CategoryValues) => Promise<boolean>
  setHidden: (householdId: string, id: string, isHidden: boolean) => Promise<void>
  remove: (householdId: string, id: string) => Promise<RemoveOutcome>
}

const visibleTo = (householdId: string) =>
  or(isNull(categories.householdId), eq(categories.householdId, householdId))

const ownCategory = (householdId: string, id: string) =>
  and(eq(categories.householdId, householdId), eq(categories.id, id))

async function list(db: Database, householdId: string): Promise<CategoryEntry[]> {
  const foodTypeCount = sql<number>`(select count(*)::int from ${foodTypes}
    where ${foodTypes.categoryId} = ${categories.id}
    and (${foodTypes.householdId} is null or ${foodTypes.householdId} = ${householdId}))`
  const productCount = sql<number>`(select count(*)::int from ${products}
    where ${products.categoryId} = ${categories.id} and ${products.householdId} = ${householdId})`
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      isSystem: categories.isSystem,
      isRetired: categories.isHidden,
      isHiddenByHousehold: categoryHiddenBy(db, householdId, categories.id),
      productGroupId: categories.productGroupId,
      productGroupName: productGroups.name,
      foodTypeCount,
      productCount,
    })
    .from(categories)
    .innerJoin(productGroups, eq(productGroups.id, categories.productGroupId))
    .where(visibleTo(householdId))
    .orderBy(asc(productGroups.sortOrder), asc(categories.sortOrder), asc(categories.name))
  return rows.map(({ isHiddenByHousehold, ...row }) => ({
    ...row,
    isHidden: row.isRetired || isHiddenByHousehold,
  }))
}

async function remove(db: Database, householdId: string, id: string): Promise<RemoveOutcome> {
  const usedByFoodType = db
    .select({ id: foodTypes.id })
    .from(foodTypes)
    .where(eq(foodTypes.categoryId, categories.id))
  const usedByProduct = db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.categoryId, categories.id))
  const deleted = await db
    .delete(categories)
    .where(and(ownCategory(householdId, id), notExists(usedByFoodType), notExists(usedByProduct)))
    .returning({ id: categories.id })
  if (deleted.length > 0) return 'removed'
  const [existing] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(ownCategory(householdId, id))
  return existing === undefined ? 'not-found' : 'in-use'
}

export function createCategoryRepository(db: Database): CategoryRepository {
  return {
    listGroups: () =>
      db
        .select({ id: productGroups.id, name: productGroups.name })
        .from(productGroups)
        .orderBy(asc(productGroups.sortOrder)),
    list: (householdId) => list(db, householdId),
    async create(householdId, values) {
      const [row] = await db
        .insert(categories)
        .values({ householdId, ...values })
        .onConflictDoNothing()
        .returning({ id: categories.id })
      return row?.id ?? null
    },
    async update(householdId, id, values) {
      const rows = await db
        .update(categories)
        .set(values)
        .where(ownCategory(householdId, id))
        .returning({ id: categories.id })
      return rows.length > 0
    },
    setHidden: (householdId, id, isHidden) => setCategoryHidden(db, { householdId, id, isHidden }),
    remove: (householdId, id) => remove(db, householdId, id),
  }
}
