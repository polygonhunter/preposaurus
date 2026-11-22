// Spielt die Stammdaten per Upsert ein (UMSETZUNG M1-07). Beliebig oft wiederholbar: Jede Zeile
// wird über ihren festen Schlüssel gefunden und nur aktualisiert. Was der Haushalt selbst
// einstellt (ausgeblendet), bleibt beim erneuten Seed erhalten.
import { sql } from 'drizzle-orm'
import type { Database } from '../../src/server/db/connection'
import { categories, containers } from '../../src/server/db/schema/catalog'
import { productGroups } from '../../src/server/db/schema/recommendation'
import { CONTAINERS } from './stammdaten/behaelter'
import { SYSTEM_CATEGORIES } from './stammdaten/kategorien'
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

function requireGroupId(groupIds: Map<string, string>, key: string): string {
  const groupId = groupIds.get(key)
  if (groupId === undefined) throw new Error(`Warengruppe ${key} fehlt im Seed`)
  return groupId
}

async function seedSystemCategories(db: Database, groupIds: Map<string, string>): Promise<void> {
  await db
    .insert(categories)
    .values(
      SYSTEM_CATEGORIES.map(({ productGroup, ...category }, index) => ({
        ...category,
        isSystem: true,
        productGroupId: requireGroupId(groupIds, productGroup),
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
    await seedSystemCategories(tx, groupIds)
    await seedContainers(tx)
  })
}
