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
  smallint,
  pgTable,
  text,
  time,
  unique,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'
import {
  ACTIVITY_LEVELS,
  CALCULATION_MODES,
  DEFAULT_AMPEL_ORANGE_DAYS,
  DEFAULT_AMPEL_YELLOW_DAYS,
  DEFAULT_WEEKLY_SUMMARY_TIME,
  DEFAULT_WEEKLY_SUMMARY_WEEKDAY,
  DIETS,
  MEMBER_CONDITIONS,
  MEMBER_TYPES,
  MIN_AMPEL_ORANGE_DAYS,
  SEXES,
} from '../../../shared/config/constants'
import { id, isOneOf, timestamps, timestampTz } from './columns'
import { sourceVersions } from './recommendation'

export const households = pgTable(
  'haushalt',
  {
    id: id(),
    name: text('name').notNull(),
    // Genutzte Fassung der Empfehlung, damit „So wird gerechnet“ Stand und Link nennen kann.
    // Leer bis zur Einrichtung. Rückverweis auf recommendation.ts: Der Typ steht fest, sonst wäre
    // die Typableitung zirkulär.
    activeSourceVersionId: uuid('aktive_quelle_version_id').references(
      (): AnyPgColumn => sourceVersions.id,
      { onDelete: 'set null' },
    ),
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
    // „Noch gut“ geprüfte, abgelaufene Einheiten zählen standardmäßig nicht zu „Heute versorgt“.
    stillGoodCountsAsSupplied: boolean('noch_gut_zaehlt_mit').notNull().default(false),
    // Erinnerungen je Haushalt (EINSTELLUNGEN_NUTZER §6.2). Wochentag nach ISO: 1 Montag … 7 Sonntag.
    weeklySummaryEnabled: boolean('wochenuebersicht_aktiv').notNull().default(true),
    weeklySummaryWeekday: smallint('wochenuebersicht_wochentag')
      .notNull()
      .default(DEFAULT_WEEKLY_SUMMARY_WEEKDAY),
    weeklySummaryTime: time('wochenuebersicht_uhrzeit')
      .notNull()
      .default(DEFAULT_WEEKLY_SUMMARY_TIME),
    urgentEnabled: boolean('dringend_aktiv').notNull().default(true),
    setupCompletedAt: timestampTz('einrichtung_abgeschlossen_am'),
    // Zuletzt erledigter Schritt der Ersteinrichtung, damit sie nach einem Abbruch dort weitergeht
    // (ONBOARDING §2.3). Bewusst ohne Obergrenze, damit ein weiterer Schritt keine Migration braucht.
    setupStep: smallint('einrichtung_schritt'),
    ...timestamps(),
  },
  (table) => [
    check('haushalt_einstellung_ernaehrungsform_check', isOneOf(table.defaultDiet, DIETS)),
    check(
      'haushalt_einstellung_ampel_check',
      sql`${table.ampelOrangeDays} >= ${sql.raw(String(MIN_AMPEL_ORANGE_DAYS))} and ${table.ampelOrangeDays} <= ${table.ampelYellowDays}`,
    ),
    check(
      'haushalt_einstellung_wochentag_check',
      sql`${table.weeklySummaryWeekday} between 1 and 7`,
    ),
    check('haushalt_einstellung_einrichtung_schritt_check', sql`${table.setupStep} >= 0`),
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
