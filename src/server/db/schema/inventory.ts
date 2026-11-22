// Vorrat: Produkt mit Einheiten, je Packung ein MHD (UMSETZUNG M1-05, technik.html „Vorrat“).
// Lagerort steht am Produkt (Freigabe L10). Wer dasselbe Produkt an zwei Orten lagert, legt es zweimal an.
// Kategorie und Lebensmittelart: kategorie_id ist Pflicht, lebensmittelart_id optional (die KI kann
// null liefern, dann wählt man von Hand). Ist eine Art gesetzt, muss kategorie_id deren Kategorie sein.
// Das sichert ein zusammengesetzter Fremdschlüssel (lebensmittelart_id, kategorie_id) ab, ohne Trigger.
// Er greift nur, wenn die Art gesetzt ist (MATCH SIMPLE), und zieht die Kategorie mit (ON UPDATE
// CASCADE), wenn eine Art in eine andere Kategorie wandert.
import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  numeric,
  pgTable,
  text,
  uuid,
} from 'drizzle-orm/pg-core'
import {
  BEST_BEFORE_KINDS,
  BEST_BEFORE_PRECISIONS,
  QUANTITY_UNITS,
  UNIT_STATUSES,
} from '../../../shared/config/constants'
import { users } from './account'
import { categories, containers, storageLocations } from './catalog'
import { id, isOneOf, timestamps, timestampTz } from './columns'
import { foodTypes } from './food-types'
import { households } from './household'

const per100 = (name: string) => numeric(name, { precision: 6, scale: 2 })

export const products = pgTable(
  'produkt',
  {
    id: id(),
    householdId: uuid('haushalt_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    categoryId: uuid('kategorie_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    foodTypeId: uuid('lebensmittelart_id'),
    containerId: uuid('behaelter_id').references(() => containers.id, { onDelete: 'set null' }),
    storageLocationId: uuid('lagerort_id').references(() => storageLocations.id, {
      onDelete: 'set null',
    }),
    name: text('bezeichnung').notNull(),
    contentAmount: numeric('inhalt_wert', { precision: 9, scale: 2 }).notNull(),
    contentUnit: text('inhalt_einheit', { enum: QUANTITY_UNITS }).notNull(),
    drainedWeightG: numeric('abtropfgewicht_g', { precision: 9, scale: 2 }),
    kcalPer100: per100('kcal_100'),
    proteinPer100: per100('eiweiss_100'),
    carbsPer100: per100('kh_100'),
    fatPer100: per100('fett_100'),
    isNutritionEstimated: boolean('naehrwerte_geschaetzt').notNull().default(false),
    // Idempotenz-Schlüssel der Erfassung: Ein doppelt gesendetes Bestätigen legt nichts doppelt an.
    captureId: uuid('erfassung_id').unique(),
    ...timestamps(),
  },
  (table) => [
    index('produkt_haushalt_id_idx').on(table.householdId),
    index('produkt_lebensmittelart_id_idx').on(table.foodTypeId),
    foreignKey({
      name: 'produkt_lebensmittelart_kategorie_fk',
      columns: [table.foodTypeId, table.categoryId],
      foreignColumns: [foodTypes.id, foodTypes.categoryId],
    })
      .onDelete('restrict')
      .onUpdate('cascade'),
    check('produkt_inhalt_einheit_check', isOneOf(table.contentUnit, QUANTITY_UNITS)),
    check('produkt_inhalt_check', sql`${table.contentAmount} > 0`),
  ],
)

export const units = pgTable(
  'einheit',
  {
    id: id(),
    productId: uuid('produkt_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    // Pflicht: Die App erfindet nie ein Datum. „Ohne Datum“ speichert eine Schätzung mit mhd_geschaetzt.
    bestBefore: date('mhd').notNull(),
    bestBeforePrecision: text('mhd_genauigkeit', { enum: BEST_BEFORE_PRECISIONS })
      .notNull()
      .default('tag'),
    bestBeforeKind: text('mhd_art', { enum: BEST_BEFORE_KINDS }).notNull().default('mhd'),
    isBestBeforeEstimated: boolean('mhd_geschaetzt').notNull().default(false),
    status: text('status', { enum: UNIT_STATUSES }).notNull().default('vorrat'),
    takenAt: timestampTz('entnommen_am'),
    takenBy: uuid('entnommen_von').references(() => users.id, { onDelete: 'set null' }),
    checkedAt: date('geprueft_am'),
    ...timestamps(),
  },
  (table) => [
    index('einheit_produkt_status_mhd_idx').on(table.productId, table.status, table.bestBefore),
    check('einheit_status_check', isOneOf(table.status, UNIT_STATUSES)),
    check(
      'einheit_mhd_genauigkeit_check',
      isOneOf(table.bestBeforePrecision, BEST_BEFORE_PRECISIONS),
    ),
    check('einheit_mhd_art_check', isOneOf(table.bestBeforeKind, BEST_BEFORE_KINDS)),
    // Verbraucht oder entsorgt heißt immer: mit Zeitpunkt. Im Vorrat gibt es keinen.
    check('einheit_entnahme_check', sql`(${table.status} = 'vorrat') = (${table.takenAt} is null)`),
  ],
)
