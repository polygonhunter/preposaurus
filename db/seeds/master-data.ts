// Spielt die Stammdaten per Upsert ein (UMSETZUNG M1-07). Beliebig oft wiederholbar: Jede Zeile
// wird über ihren festen Schlüssel gefunden und nur aktualisiert. Was der Haushalt selbst
// einstellt (ausgeblendet), bleibt beim erneuten Seed erhalten. Richtwerte der Lebensmittelarten
// (kcal, Makros, übliche Haltbarkeit) übernimmt der Seed auch beim Aktualisieren: Die Quelle dafür
// sind die Seed-Dateien.
import { sql } from 'drizzle-orm'
import type { Database } from '../../src/server/db/connection'
import { categories, containers } from '../../src/server/db/schema/catalog'
import { foodTypes } from '../../src/server/db/schema/food-types'
import { productGroups } from '../../src/server/db/schema/recommendation'
import { CONTAINERS } from './stammdaten/behaelter'
import { SYSTEM_CATEGORIES } from './stammdaten/kategorien'
import { SYSTEM_FOOD_TYPES } from './stammdaten/lebensmittelarten'
import { PRODUCT_GROUPS } from './stammdaten/warengruppen'

const SORT_STEP = 10
const sortOrderOf = (index: number) => (index + 1) * SORT_STEP

// Bei einem Konflikt den neuen Wert übernehmen (Spalte aus der abgelehnten Zeile).
const fromExcluded = (column: string) => sql.raw(`excluded."${column}"`)

async function seedProductGroups(db: Database): Promise<Map<string, string>> {
  const rows = await db
    .insert(productGroups)
    .values(PRODUCT_GROUPS.map((group, index) => ({ ...group, sortOrder: sortOrderOf(index) })))
    .onConflictDoUpdate({
      target: productGroups.key,
      set: { name: fromExcluded('name'), sortOrder: fromExcluded('sortierung') },
    })
    .returning({ id: productGroups.id, key: productGroups.key })
  return new Map(rows.map((row) => [row.key, row.id]))
}

function requireId(ids: Map<string, string>, key: string): string {
  const found = ids.get(key)
  if (found === undefined) throw new Error(`Schlüssel ${key} fehlt im Seed`)
  return found
}

async function seedSystemCategories(
  db: Database,
  groupIds: Map<string, string>,
): Promise<Map<string, string>> {
  const rows = await db
    .insert(categories)
    .values(
      SYSTEM_CATEGORIES.map(({ productGroup, ...category }, index) => ({
        ...category,
        isSystem: true,
        productGroupId: requireId(groupIds, productGroup),
        sortOrder: sortOrderOf(index),
      })),
    )
    .onConflictDoUpdate({
      target: categories.key,
      set: {
        name: fromExcluded('name'),
        pictogram: fromExcluded('piktogramm'),
        productGroupId: fromExcluded('warengruppe_id'),
        sortOrder: fromExcluded('sortierung'),
      },
    })
    .returning({ id: categories.id, key: categories.key })
  return new Map(rows.map((row) => [row.key ?? '', row.id]))
}

// Wandert eine Art in eine andere Kategorie, ziehen ihre Produkte per ON UPDATE CASCADE mit.
async function seedSystemFoodTypes(db: Database, categoryIds: Map<string, string>): Promise<void> {
  await db
    .insert(foodTypes)
    .values(
      SYSTEM_FOOD_TYPES.map(({ category, ...foodType }, index) => ({
        ...foodType,
        kcalPer100: foodType.kcalPer100 ?? null,
        proteinPer100: foodType.proteinPer100 ?? null,
        carbsPer100: foodType.carbsPer100 ?? null,
        fatPer100: foodType.fatPer100 ?? null,
        typicalShelfLifeMonths: foodType.typicalShelfLifeMonths ?? null,
        isSystem: true,
        categoryId: requireId(categoryIds, category),
        sortOrder: sortOrderOf(index),
      })),
    )
    .onConflictDoUpdate({
      target: foodTypes.key,
      // Passend zum Teilindex lebensmittelart_schluessel_system_eindeutig
      targetWhere: sql`${foodTypes.householdId} is null`,
      set: {
        name: fromExcluded('name'),
        categoryId: fromExcluded('kategorie_id'),
        sortOrder: fromExcluded('sortierung'),
        kcalPer100: fromExcluded('kcal_100'),
        proteinPer100: fromExcluded('eiweiss_100'),
        carbsPer100: fromExcluded('kh_100'),
        fatPer100: fromExcluded('fett_100'),
        typicalShelfLifeMonths: fromExcluded('uebliche_haltbarkeit_monate'),
      },
    })
}

async function seedContainers(db: Database): Promise<void> {
  await db
    .insert(containers)
    .values(CONTAINERS.map((container, index) => ({ ...container, sortOrder: sortOrderOf(index) })))
    .onConflictDoUpdate({
      target: containers.key,
      set: { name: fromExcluded('name'), sortOrder: fromExcluded('sortierung') },
    })
}

export async function seedMasterData(db: Database): Promise<void> {
  await db.transaction(async (tx) => {
    const groupIds = await seedProductGroups(tx)
    const categoryIds = await seedSystemCategories(tx, groupIds)
    await seedSystemFoodTypes(tx, categoryIds)
    await seedContainers(tx)
  })
}
