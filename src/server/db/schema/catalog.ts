// Ordnung des Vorrats: Kategorie, Behälter, Lagerort (UMSETZUNG M1-05, 01 „Ordnungssystem“).
// System-Kategorien und Behälter kommen als Seed ohne Haushalt (db/seeds). Eigene Kategorien
// gehören einem Haushalt. tag und produkt_tag kommen später (Grundentscheidung 7).
import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  index,
  integer,
  numeric,
  pgTable,
  text,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
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
    // Ersatzwerte für fehlende Angaben, als „geschätzt“ markiert. Werte kommen mit M1-08.
    averageKcalPer100: numeric('kcal_durchschnitt_100', { precision: 6, scale: 1 }),
    typicalShelfLifeMonths: integer('uebliche_haltbarkeit_monate'),
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
    check('kategorie_kcal_check', sql`${table.averageKcalPer100} >= 0`),
    check('kategorie_haltbarkeit_check', sql`${table.typicalShelfLifeMonths} > 0`),
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
    sortOrder: integer('sortierung').notNull().default(0),
    ...timestamps(),
  },
  (table) => [unique('lagerort_eindeutig').on(table.householdId, table.name)],
)
