// Haushalt mit Einstellungen und Mitgliedern (UMSETZUNG M1-03, technik.html „Haushalt und Konto“).
// Ein Mitglied ist eine Person im Haushalt, auch ohne Login. Nicht angelegt, weil später:
// inventur_intervall und ki_modell_* (UMSETZUNG Grundentscheidung 7, Modelle siehe ai-settings.ts).
import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  date,
  index,
  integer,
  numeric,
  pgTable,
  text,
  unique,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'
import {
  ACTIVITY_LEVELS,
  CALCULATION_MODES,
  DEFAULT_AMPEL_ORANGE_DAYS,
  DEFAULT_AMPEL_YELLOW_DAYS,
  DIETS,
  MEMBER_CONDITIONS,
  MEMBER_TYPES,
  SEXES,
} from '../../../shared/config/constants'
import { id, isOneOf, timestamps } from './columns'
import { sources } from './recommendation'

export const households = pgTable(
  'haushalt',
  {
    id: id(),
    name: text('name').notNull(),
    // Rückverweis auf recommendation.ts: Der Typ steht fest, sonst wäre die Typableitung zirkulär.
    activeSourceId: uuid('aktive_quelle_id').references((): AnyPgColumn => sources.id, {
      onDelete: 'set null',
    }),
    calculationMode: text('rechenmodus', { enum: CALCULATION_MODES })
      .notNull()
      .default('offiziell'),
    ...timestamps(),
  },
  (table) => [
    check('haushalt_rechenmodus_check', isOneOf(table.calculationMode, CALCULATION_MODES)),
  ],
)

export const householdSettings = pgTable(
  'haushalt_einstellung',
  {
    id: id(),
    householdId: uuid('haushalt_id')
      .notNull()
      .unique()
      .references(() => households.id, { onDelete: 'cascade' }),
    defaultDiet: text('standard_ernaehrungsform', { enum: DIETS }).notNull().default('alles'),
    ampelYellowDays: integer('ampel_gelb_tage').notNull().default(DEFAULT_AMPEL_YELLOW_DAYS),
    ampelOrangeDays: integer('ampel_orange_tage').notNull().default(DEFAULT_AMPEL_ORANGE_DAYS),
    // Aus, bis der Admin die Foto-Erkennung bewusst einschaltet: Fotos gehen dann an den Anbieter.
    isAiEnabled: boolean('ki_aktiv').notNull().default(false),
    ...timestamps(),
  },
  (table) => [
    check('haushalt_einstellung_ernaehrungsform_check', isOneOf(table.defaultDiet, DIETS)),
    check(
      'haushalt_einstellung_ampel_check',
      sql`${table.ampelOrangeDays} > 0 and ${table.ampelOrangeDays} <= ${table.ampelYellowDays}`,
    ),
  ],
)

export const members = pgTable(
  'mitglied',
  {
    id: id(),
    householdId: uuid('haushalt_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    pictogram: text('piktogramm'),
    type: text('typ', { enum: MEMBER_TYPES }).notNull(),
    birthDate: date('geburtsdatum'),
    sex: text('geschlecht', { enum: SEXES }),
    activityLevel: text('aktivitaet', { enum: ACTIVITY_LEVELS }),
    weightKg: numeric('gewicht_kg', { precision: 5, scale: 1 }),
    condition: text('zustand', { enum: MEMBER_CONDITIONS }),
    // Leer heißt: Es gilt die Standard-Ernährungsform des Haushalts.
    diet: text('ernaehrungsform', { enum: DIETS }),
    ...timestamps(),
  },
  (table) => [
    index('mitglied_haushalt_id_idx').on(table.householdId),
    check('mitglied_typ_check', isOneOf(table.type, MEMBER_TYPES)),
    check('mitglied_geschlecht_check', isOneOf(table.sex, SEXES)),
    check('mitglied_aktivitaet_check', isOneOf(table.activityLevel, ACTIVITY_LEVELS)),
    check('mitglied_zustand_check', isOneOf(table.condition, MEMBER_CONDITIONS)),
    check('mitglied_ernaehrungsform_check', isOneOf(table.diet, DIETS)),
    check('mitglied_gewicht_check', sql`${table.weightKg} > 0`),
  ],
)

export const memberAllergies = pgTable(
  'mitglied_allergie',
  {
    id: id(),
    memberId: uuid('mitglied_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    label: text('bezeichnung').notNull(),
    ...timestamps(),
  },
  (table) => [unique('mitglied_allergie_eindeutig').on(table.memberId, table.label)],
)
