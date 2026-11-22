// Ordnung des Vorrats: Kategorie, Behälter, Lagerort (UMSETZUNG M1-05). System-Einträge kommen als
// Seed ohne Haushalt, eigene gehören einem Haushalt. Richtwerte stehen an der Lebensmittelart.
import { sql } from 'drizzle-orm'
import { boolean, check, index, integer, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core'
import { id, timestamps } from './columns'
import { households } from './household'
import { productGroups } from './recommendation'

export const categories = pgTable(
  'kategorie',
  {
    id: id(),
    // Leer bei System-Kategorien, gesetzt bei eigenen Kategorien eines Haushalts.
    householdId: uuid('haushalt_id').references(() => households.id, { onDelete: 'cascade' }),
    isSystem: boolean('ist_system').notNull().default(false),
    // Fester Schlüssel nur für System-Kategorien, damit der Seed dieselbe Zeile wiederfindet.
    key: text('schluessel').unique(),
    name: text('name').notNull(),
    pictogram: text('piktogramm'),
    // Jede Kategorie zählt in genau eine Warengruppe, damit der Rechner immer stimmt.
    productGroupId: uuid('warengruppe_id')
      .notNull()
      .references(() => productGroups.id, { onDelete: 'restrict' }),
    isHidden: boolean('ausgeblendet').notNull().default(false),
    sortOrder: integer('sortierung').notNull().default(0),
    ...timestamps(),
  },
  (table) => [
    index('kategorie_haushalt_id_idx').on(table.householdId),
    // Eine eigene Kategorie heißt je Haushalt nur einmal so (System-Kategorien haben keinen Haushalt).
    unique('kategorie_name_eindeutig').on(table.householdId, table.name),
    check(
      'kategorie_herkunft_check',
      sql`${table.isSystem} = (${table.householdId} is null) and ${table.isSystem} = (${table.key} is not null)`,
    ),
  ],
)

export const containers = pgTable('behaelter', {
  id: id(),
  key: text('schluessel').notNull().unique(),
  name: text('name').notNull(),
  sortOrder: integer('sortierung').notNull().default(0),
  ...timestamps(),
})

export const storageLocations = pgTable(
  'lagerort',
  {
    id: id(),
    householdId: uuid('haushalt_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    // Ausgeblendet wird statt gelöscht, damit kein Produkt ins Leere zeigt (EIN-04).
    isHidden: boolean('ausgeblendet').notNull().default(false),
    sortOrder: integer('sortierung').notNull().default(0),
    ...timestamps(),
  },
  (table) => [unique('lagerort_eindeutig').on(table.householdId, table.name)],
)
