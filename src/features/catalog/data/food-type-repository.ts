// Lebensmittelarten in der Verwaltung (#126, #243): System-Arten und eigene des Haushalts. Jede
// Abfrage filtert auf den Haushalt. Ändern, Sortieren und Löschen treffen nur eigene Arten; die
// Suchwörter werden beim Speichern als Ganzes ersetzt. Wechselt eine eigene Art die Kategorie,
// ziehen ihre Produkte über den zusammengesetzten Fremdschlüssel (ON UPDATE CASCADE) mit, und sie
// rückt dort ans Ende der eigenen Arten.
import 'server-only'
import { and, asc, eq, isNull, notExists, or, sql } from 'drizzle-orm'
import type { FoodTypeEntry, FoodTypeReference } from '@/features/catalog/domain/category'
import type { Database } from '@/server/db/connection'
import { loadOwnSearchTerms } from '@/server/db/queries/own-search-terms'
import { categories } from '@/server/db/schema/catalog'
import { foodTypeSearchTerms } from '@/server/db/schema/catalog-choices'
import { foodTypes } from '@/server/db/schema/food-types'
import { products } from '@/server/db/schema/inventory'
import { productGroups } from '@/server/db/schema/recommendation'
import { categoryHiddenBy, foodTypeHiddenBy, setFoodTypeHidden } from './catalog-hiding'
import { fromReferenceRow, referenceColumns, toReferenceRow } from './food-type-columns'
import type { RemoveOutcome } from './remove-outcome'

type FoodTypeValues = FoodTypeReference &
  Readonly<{
    name: string
    categoryId: string
    searchTerms: readonly string[]
  }>

export interface FoodTypeRepository {
  list: (householdId: string) => Promise<FoodTypeEntry[]>
  /** Alle Schlüssel eigener Arten des Haushalts, für einen neuen eindeutigen Schlüssel */
  listOwnKeys: (householdId: string) => Promise<string[]>
  /** null, wenn Name oder Schlüssel schon vergeben sind */
  create: (householdId: string, values: FoodTypeValues & { key: string }) => Promise<string | null>
  update: (householdId: string, id: string, values: FoodTypeValues) => Promise<boolean>
  setHidden: (householdId: string, id: string, isHidden: boolean) => Promise<void>
  remove: (householdId: string, id: string) => Promise<RemoveOutcome>
  /** Nummeriert die übergebenen eigenen Arten in dieser Reihenfolge neu durch */
  saveOrder: (householdId: string, ids: readonly string[]) => Promise<void>
}

const ownFoodType = (householdId: string, id: string) =>
  and(eq(foodTypes.householdId, householdId), eq(foodTypes.id, id))

// Eigene Arten stehen in ihrer Kategorie vor den System-Arten (Sortierung nach ist_system, dann
// sortierung), eine neue kommt ans Ende der eigenen.
const nextOwnSortOrder = (householdId: string, categoryId: string) =>
  sql<number>`(select coalesce(max(own.sortierung), -1) + 1 from ${foodTypes} own
    where own.haushalt_id = ${householdId} and own.kategorie_id = ${categoryId})`

// Wie der Baum: Warengruppe, Kategorie, eigene Arten vor denen der Startliste
const CATALOG_ORDER = [
  asc(productGroups.sortOrder),
  asc(categories.name),
  asc(foodTypes.isSystem),
  asc(foodTypes.sortOrder),
  asc(foodTypes.name),
]

async function list(db: Database, householdId: string): Promise<FoodTypeEntry[]> {
  const productCount = sql<number>`(select count(*)::int from ${products}
    where ${products.foodTypeId} = ${foodTypes.id} and ${products.householdId} = ${householdId})`
  const rows = await db
    .select({
      id: foodTypes.id,
      key: foodTypes.key,
      name: foodTypes.name,
      isSystem: foodTypes.isSystem,
      isRetired: foodTypes.isHidden,
      isHiddenByHousehold: foodTypeHiddenBy(db, householdId, foodTypes.id),
      categoryId: foodTypes.categoryId,
      categoryName: categories.name,
      isCategoryRetired: categories.isHidden,
      isCategoryHiddenByHousehold: categoryHiddenBy(db, householdId, categories.id),
      productGroupName: productGroups.name,
      ...referenceColumns,
      productCount,
    })
    .from(foodTypes)
    .innerJoin(categories, eq(categories.id, foodTypes.categoryId))
    .innerJoin(productGroups, eq(productGroups.id, categories.productGroupId))
    .where(or(isNull(foodTypes.householdId), eq(foodTypes.householdId, householdId)))
    .orderBy(...CATALOG_ORDER)
  const terms = await loadOwnSearchTerms(db, householdId)
  return rows.map(
    ({ isHiddenByHousehold, isCategoryRetired, isCategoryHiddenByHousehold, ...row }) => ({
      ...row,
      isHidden: row.isRetired || isHiddenByHousehold,
      isCategoryHidden: isCategoryRetired || isCategoryHiddenByHousehold,
      ...fromReferenceRow(row),
      searchTerms: terms.get(row.id) ?? [],
    }),
  )
}

async function create(
  db: Database,
  householdId: string,
  { searchTerms, ...values }: FoodTypeValues & { key: string },
): Promise<string | null> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(foodTypes)
      .values({
        householdId,
        key: values.key,
        name: values.name,
        categoryId: values.categoryId,
        ...toReferenceRow(values),
        sortOrder: nextOwnSortOrder(householdId, values.categoryId),
      })
      .onConflictDoNothing()
      .returning({ id: foodTypes.id })
    if (row === undefined) return null
    if (searchTerms.length > 0) {
      await tx
        .insert(foodTypeSearchTerms)
        .values(searchTerms.map((term) => ({ foodTypeId: row.id, term })))
    }
    return row.id
  })
}

async function update(
  db: Database,
  { householdId, id }: Readonly<{ householdId: string; id: string }>,
  { searchTerms, ...values }: FoodTypeValues,
): Promise<boolean> {
  const sortOrder = sql<number>`case when ${foodTypes.categoryId} = ${values.categoryId}
    then ${foodTypes.sortOrder} else ${nextOwnSortOrder(householdId, values.categoryId)} end`
  return db.transaction(async (tx) => {
    const rows = await tx
      .update(foodTypes)
      .set({
        name: values.name,
        categoryId: values.categoryId,
        ...toReferenceRow(values),
        sortOrder,
      })
      .where(ownFoodType(householdId, id))
      .returning({ id: foodTypes.id })
    if (rows.length === 0) return false
    await tx.delete(foodTypeSearchTerms).where(eq(foodTypeSearchTerms.foodTypeId, id))
    if (searchTerms.length > 0) {
      await tx
        .insert(foodTypeSearchTerms)
        .values(searchTerms.map((term) => ({ foodTypeId: id, term })))
    }
    return true
  })
}

async function remove(db: Database, householdId: string, id: string): Promise<RemoveOutcome> {
  const usedBy = db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.foodTypeId, foodTypes.id))
  const deleted = await db
    .delete(foodTypes)
    .where(and(ownFoodType(householdId, id), notExists(usedBy)))
    .returning({ id: foodTypes.id })
  if (deleted.length > 0) return 'removed'
  const [existing] = await db
    .select({ id: foodTypes.id })
    .from(foodTypes)
    .where(ownFoodType(householdId, id))
  return existing === undefined ? 'not-found' : 'in-use'
}

async function saveOrder(db: Database, householdId: string, ids: readonly string[]) {
  await db.transaction(async (tx) => {
    for (const [sortOrder, id] of ids.entries()) {
      await tx.update(foodTypes).set({ sortOrder }).where(ownFoodType(householdId, id))
    }
  })
}

export function createFoodTypeRepository(db: Database): FoodTypeRepository {
  return {
    list: (householdId) => list(db, householdId),
    async listOwnKeys(householdId) {
      const rows = await db
        .select({ key: foodTypes.key })
        .from(foodTypes)
        .where(eq(foodTypes.householdId, householdId))
      return rows.map((row) => row.key)
    },
    create: (householdId, values) => create(db, householdId, values),
    update: (householdId, id, values) => update(db, { householdId, id }, values),
    setHidden: (householdId, id, isHidden) => setFoodTypeHidden(db, { householdId, id, isHidden }),
    remove: (householdId, id) => remove(db, householdId, id),
    saveOrder: (householdId, ids) => saveOrder(db, householdId, ids),
  }
}
