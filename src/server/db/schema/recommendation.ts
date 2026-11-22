// Empfehlung und Ziel (UMSETZUNG M1-04, technik.html „Empfehlung und Ziel“).
// Empfehlungswerte sind versioniert: Eine neue Fassung einer Quelle ist eine neue quelle_version,
// alte Fassungen bleiben stehen. Die Warengruppe hat einen festen Schlüssel, versioniert sind nur
// die Mengen in quelle_wert. ziel_etappe kommt später (Grundentscheidung 7).
import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  date,
  integer,
  numeric,
  pgTable,
  text,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
import { DIETS, QUANTITY_UNITS } from '../../../shared/config/constants'
import { id, isOneOf, timestamps } from './columns'
import { households } from './household'

export const sources = pgTable('quelle', {
  id: id(),
  // Fester Schlüssel für Seeds (z. B. bbk-ble), damit ein erneuter Seed dieselbe Zeile trifft.
  key: text('schluessel').notNull().unique(),
  name: text('name').notNull(),
  country: text('land').notNull(),
  ...timestamps(),
})

export const sourceVersions = pgTable(
  'quelle_version',
  {
    id: id(),
    sourceId: uuid('quelle_id')
      .notNull()
      .references(() => sources.id, { onDelete: 'restrict' }),
    asOf: text('stand').notNull(),
    link: text('link').notNull(),
    defaultDays: integer('standard_tage').notNull(),
    // Erst true, wenn ein Mensch die Werte gegen das Original geprüft hat (UMSETZUNG M1-09, U3).
    isVerified: boolean('geprueft').notNull().default(false),
    ...timestamps(),
  },
  (table) => [
    unique('quelle_version_eindeutig').on(table.sourceId, table.asOf),
    check('quelle_version_standard_tage_check', sql`${table.defaultDays} > 0`),
  ],
)

// Bedarf je Personengruppe für den Modus „offiziell“ (z. B. erwachsen, kind).
export const sourceNeeds = pgTable(
  'quelle_bedarf',
  {
    id: id(),
    sourceVersionId: uuid('quelle_version_id')
      .notNull()
      .references(() => sourceVersions.id, { onDelete: 'cascade' }),
    personGroup: text('personengruppe').notNull(),
    kcalPerDay: numeric('kcal_tag', { precision: 7, scale: 1 }).notNull(),
    waterLitersPerDay: numeric('wasser_l_tag', { precision: 4, scale: 2 }).notNull(),
    ...timestamps(),
  },
  (table) => [
    unique('quelle_bedarf_eindeutig').on(table.sourceVersionId, table.personGroup),
    check(
      'quelle_bedarf_werte_check',
      sql`${table.kcalPerDay} >= 0 and ${table.waterLitersPerDay} >= 0`,
    ),
  ],
)

export const productGroups = pgTable('warengruppe', {
  id: id(),
  key: text('schluessel').notNull().unique(),
  name: text('name').notNull(),
  sortOrder: integer('sortierung').notNull().default(0),
  ...timestamps(),
})

// Menge je Person und Tag. Die Ernährungsform verschiebt Mengen zwischen Warengruppen,
// deshalb steht je Form eine eigene Zeile da (versionierte Seed-Daten statt festem Code).
export const sourceValues = pgTable(
  'quelle_wert',
  {
    id: id(),
    sourceVersionId: uuid('quelle_version_id')
      .notNull()
      .references(() => sourceVersions.id, { onDelete: 'cascade' }),
    productGroupId: uuid('warengruppe_id')
      .notNull()
      .references(() => productGroups.id, { onDelete: 'restrict' }),
    diet: text('ernaehrungsform', { enum: DIETS }).notNull().default('alles'),
    amountPerPersonDay: numeric('menge_pro_person_tag', { precision: 9, scale: 2 }).notNull(),
    unit: text('mass_einheit', { enum: QUANTITY_UNITS }).notNull(),
    ...timestamps(),
  },
  (table) => [
    unique('quelle_wert_eindeutig').on(table.sourceVersionId, table.productGroupId, table.diet),
    check('quelle_wert_ernaehrungsform_check', isOneOf(table.diet, DIETS)),
    check('quelle_wert_mass_einheit_check', isOneOf(table.unit, QUANTITY_UNITS)),
    check('quelle_wert_menge_check', sql`${table.amountPerPersonDay} >= 0`),
  ],
)

// Im MVP ein Ziel je Haushalt. Etappen kommen später.
export const goals = pgTable(
  'ziel',
  {
    id: id(),
    householdId: uuid('haushalt_id')
      .notNull()
      .unique()
      .references(() => households.id, { onDelete: 'cascade' }),
    days: integer('tage').notNull(),
    targetDate: date('zieldatum'),
    ...timestamps(),
  },
  (table) => [check('ziel_tage_check', sql`${table.days} > 0`)],
)
