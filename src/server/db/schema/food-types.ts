// Lebensmittelart: feste Ebene unter der Kategorie (Maintainer-Entscheidung zu M1).
// Baum: Warengruppe → Kategorie → Lebensmittelart → Produkt → Einheit.
// System-Arten kommen als Seed ohne Haushalt, eigene Arten gehören einem Haushalt (wie kategorie).
// Richtwerte je 100 g bzw. ml (kcal und Makros, E-8/E-9) rechnen mit „ca.“, wenn am Produkt keine
// Nährwerte stehen. Sie werden live gelesen, nicht ins Produkt kopiert (E-5).
// uebliche_haltbarkeit_monate wird nie automatisch als MHD verwendet.
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
  uniqueIndex,
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
    // Slug für Seed und KI (#110: die KI bekommt die Schlüssel als Enum). System-Arten haben einen
    // festen Slug (spaghetti), eigene Arten einen erzeugten mit Präfix eigen_ (eigen_dinkelnudeln).
    // Das Präfix verhindert, dass eine eigene Art den Schlüssel einer System-Art belegt.
    key: text('schluessel').notNull(),
    name: text('name').notNull(),
    categoryId: uuid('kategorie_id')
      .notNull()
      // NO ACTION statt RESTRICT: prüft erst am Ende der Anweisung, damit das Löschen eines
      // Haushalts eigene Kategorien und Arten gemeinsam per CASCADE entfernen kann.
      .references(() => categories.id, { onDelete: 'no action' }),
    isHidden: boolean('ausgeblendet').notNull().default(false),
    sortOrder: integer('sortierung').notNull().default(0),
    kcalPer100: numeric('kcal_100', { precision: 6, scale: 1 }),
    proteinPer100: numeric('eiweiss_100', { precision: 6, scale: 1 }),
    carbsPer100: numeric('kh_100', { precision: 6, scale: 1 }),
    fatPer100: numeric('fett_100', { precision: 6, scale: 1 }),
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
    // System-Schlüssel global eindeutig, eigene je Haushalt.
    uniqueIndex('lebensmittelart_schluessel_system_eindeutig')
      .on(table.key)
      .where(sql`${table.householdId} is null`),
    uniqueIndex('lebensmittelart_schluessel_eigen_eindeutig')
      .on(table.householdId, table.key)
      .where(sql`${table.householdId} is not null`),
    check(
      'lebensmittelart_herkunft_check',
      sql`${table.isSystem} = (${table.householdId} is null) and ${table.isSystem} = (${table.key} !~ '^eigen_')`,
    ),
    check('lebensmittelart_schluessel_check', sql`${table.key} ~ '^[a-z0-9_]{2,60}$'`),
    check('lebensmittelart_kcal_check', sql`${table.kcalPer100} >= 0`),
    check(
      'lebensmittelart_makros_check',
      sql`${table.proteinPer100} >= 0 and ${table.carbsPer100} >= 0 and ${table.fatPer100} >= 0`,
    ),
    check('lebensmittelart_haltbarkeit_check', sql`${table.typicalShelfLifeMonths} > 0`),
  ],
)
