// Lebensmittelart: feste Ebene unter der Kategorie (Maintainer-Entscheidung zu M1).
// Baum: Warengruppe → Kategorie → Lebensmittelart → Produkt → Einheit.
// System-Arten kommen als Seed ohne Haushalt, eigene Arten gehören einem Haushalt (wie kategorie).
// kcal_100 und uebliche_haltbarkeit_monate sind reine Anzeige-Richtwerte und werden nie als MHD verwendet.
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
import { categories } from './catalog'
import { id, timestamps } from './columns'
import { households } from './household'

export const foodTypes = pgTable(
  'lebensmittelart',
  {
    id: id(),
    householdId: uuid('haushalt_id').references(() => households.id, { onDelete: 'cascade' }),
    isSystem: boolean('ist_system').notNull().default(false),
    // Fester Slug nur für System-Arten (z. B. spaghetti), damit der Seed dieselbe Zeile wiederfindet.
    key: text('schluessel').unique(),
    name: text('name').notNull(),
    categoryId: uuid('kategorie_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    isHidden: boolean('ausgeblendet').notNull().default(false),
    sortOrder: integer('sortierung').notNull().default(0),
    kcalPer100: numeric('kcal_100', { precision: 6, scale: 1 }),
    typicalShelfLifeMonths: integer('uebliche_haltbarkeit_monate'),
    ...timestamps(),
  },
  (table) => [
    index('lebensmittelart_kategorie_id_idx').on(table.categoryId),
    index('lebensmittelart_haushalt_id_idx').on(table.householdId),
    // Ziel des zusammengesetzten Fremdschlüssels produkt(lebensmittelart_id, kategorie_id).
    unique('lebensmittelart_id_kategorie_eindeutig').on(table.id, table.categoryId),
    // Eine eigene Art heißt je Haushalt nur einmal so.
    unique('lebensmittelart_name_eindeutig').on(table.householdId, table.name),
    check(
      'lebensmittelart_herkunft_check',
      sql`${table.isSystem} = (${table.householdId} is null) and ${table.isSystem} = (${table.key} is not null)`,
    ),
    check('lebensmittelart_kcal_check', sql`${table.kcalPer100} >= 0`),
    check('lebensmittelart_haltbarkeit_check', sql`${table.typicalShelfLifeMonths} > 0`),
  ],
)
