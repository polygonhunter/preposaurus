// Vorrat: Produkt mit Einheiten, je Packung ein MHD (UMSETZUNG M1-05, technik.html „Vorrat“).
// Lagerort steht am Produkt (Freigabe L10). Wer dasselbe Produkt an zwei Orten lagert, legt es zweimal an.
// Kategorie und Lebensmittelart: kategorie_id ist Pflicht, lebensmittelart_id optional (die KI kann
// null liefern, dann wählt man von Hand). Ist eine Art gesetzt, muss kategorie_id deren Kategorie sein.
// Das sichert ein zusammengesetzter Fremdschlüssel (lebensmittelart_id, kategorie_id) ab, ohne Trigger.
// Er greift nur, wenn die Art gesetzt ist (MATCH SIMPLE), und zieht die Kategorie mit (ON UPDATE
// CASCADE), wenn eine Art in eine andere Kategorie wandert.
// Löschschutz mit NO ACTION statt RESTRICT: Beides verhindert das Löschen einer benutzten Kategorie
// oder Art, NO ACTION prüft aber erst am Ende der Anweisung. Nur so kann das Löschen eines
// Haushalts Produkte, eigene Arten und eigene Kategorien gemeinsam per CASCADE entfernen.
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
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
import {
  BEST_BEFORE_KINDS,
  BEST_BEFORE_PRECISIONS,
  NUTRITION_SOURCES,
  QUANTITY_UNITS,
  UNIT_STATUSES,
} from '../../../shared/config/constants'
import { users } from './account'
import { captures } from './confirmed-captures'
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
      .references(() => categories.id, { onDelete: 'no action' }),
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
    // Leer genau dann, wenn alle vier Nährwerte leer sind. Dann ergänzt die App beim Lesen den
    // Richtwert der Lebensmittelart, kopiert ihn aber nie hierher (E-5). ki_schaetzung zeigt die
    // App als „ca.“, bis jemand sie bestätigt hat.
    nutritionSource: text('naehrwerte_quelle', { enum: NUTRITION_SOURCES }),
    nutritionConfirmedAt: timestampTz('naehrwerte_bestaetigt_am'),
    ...timestamps(),
  },
  (table) => [
    index('produkt_haushalt_id_idx').on(table.householdId),
    index('produkt_lebensmittelart_id_idx').on(table.foodTypeId),
    // Filter im Vorrat: Kategorie, Behälter („Alle Dosen“), Lagerort
    index('produkt_kategorie_id_idx').on(table.categoryId),
    index('produkt_behaelter_id_idx').on(table.containerId),
    index('produkt_lagerort_id_idx').on(table.storageLocationId),
    foreignKey({
      name: 'produkt_lebensmittelart_kategorie_fk',
      columns: [table.foodTypeId, table.categoryId],
      foreignColumns: [foodTypes.id, foodTypes.categoryId],
    })
      .onDelete('no action')
      .onUpdate('cascade'),
    check('produkt_inhalt_einheit_check', isOneOf(table.contentUnit, QUANTITY_UNITS)),
    check('produkt_inhalt_check', sql`${table.contentAmount} > 0`),
    check('produkt_naehrwerte_quelle_check', isOneOf(table.nutritionSource, NUTRITION_SOURCES)),
    check(
      'produkt_naehrwerte_bestaetigt_check',
      sql`${table.nutritionConfirmedAt} is null or ${table.nutritionSource} is not null`,
    ),
    check(
      'produkt_naehrwerte_vollstaendig_check',
      sql`(${table.nutritionSource} is null) = (${table.kcalPer100} is null
        and ${table.proteinPer100} is null and ${table.carbsPer100} is null
        and ${table.fatPer100} is null)`,
    ),
  ],
)

export const units = pgTable(
  'einheit',
  {
    id: id(),
    productId: uuid('produkt_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    // Leer heißt „Datum fehlt“ und lässt sich später von Hand nachtragen. Die App erfindet nie ein
    // Datum: Eine KI-Schätzung gibt es nur auf ausdrückliche Wahl, dann mit mhd_geschaetzt markiert.
    bestBefore: date('mhd'),
    // Leer genau dann, wenn das Datum fehlt.
    bestBeforePrecision: text('mhd_genauigkeit', { enum: BEST_BEFORE_PRECISIONS }),
    bestBeforeKind: text('mhd_art', { enum: BEST_BEFORE_KINDS }).notNull().default('mhd'),
    isBestBeforeEstimated: boolean('mhd_geschaetzt').notNull().default(false),
    status: text('status', { enum: UNIT_STATUSES }).notNull().default('vorrat'),
    takenAt: timestampTz('entnommen_am'),
    takenBy: uuid('entnommen_von').references(() => users.id, { onDelete: 'set null' }),
    checkedAt: date('geprueft_am'),
    // Erfassung, mit der die Packung dazukam (Idempotenz auch beim Nachschub, Verlauf „hinzugefügt“).
    // NO ACTION DEFERRABLE INITIALLY DEFERRED (Migration 0007, #237, #133): Eine Erfassung mit
    // Packungen lässt sich nicht einzeln löschen, die Historie verschwindet also nie still. Geprüft
    // wird erst am Ende der Transaktion, damit das Löschen eines Haushalts weiter alles per CASCADE
    // entfernt. Drizzle kennt DEFERRABLE nicht: Wer diesen Fremdschlüssel ändert, übernimmt es von
    // Hand in die neue Migration.
    captureId: uuid('erfassung_id')
      .notNull()
      .references(() => captures.id, { onDelete: 'no action' }),
    ...timestamps(),
  },
  (table) => [
    index('einheit_erfassung_id_idx').on(table.captureId),
    index('einheit_produkt_status_mhd_idx').on(table.productId, table.status, table.bestBefore),
    // „Bald fällig“ und „Abgelaufen“ über den ganzen Vorrat, ohne die Historie zu durchsuchen
    index('einheit_mhd_vorrat_idx')
      .on(table.bestBefore)
      .where(sql`${table.status} = 'vorrat'`),
    check('einheit_status_check', isOneOf(table.status, UNIT_STATUSES)),
    check(
      'einheit_mhd_genauigkeit_check',
      isOneOf(table.bestBeforePrecision, BEST_BEFORE_PRECISIONS),
    ),
    check(
      'einheit_mhd_genauigkeit_leer_check',
      sql`(${table.bestBefore} is null) = (${table.bestBeforePrecision} is null)`,
    ),
    check('einheit_mhd_art_check', isOneOf(table.bestBeforeKind, BEST_BEFORE_KINDS)),
    // Geschätzt kann nur ein Datum sein, das es gibt.
    check(
      'einheit_mhd_geschaetzt_check',
      sql`not ${table.isBestBeforeEstimated} or ${table.bestBefore} is not null`,
    ),
    // Verbraucht oder entsorgt heißt immer: mit Zeitpunkt. Im Vorrat gibt es keinen.
    check('einheit_entnahme_check', sql`(${table.status} = 'vorrat') = (${table.takenAt} is null)`),
    check(
      'einheit_entnommen_von_check',
      sql`${table.status} <> 'vorrat' or ${table.takenBy} is null`,
    ),
    // Ziel des zusammengesetzten Fremdschlüssels foto(einheit_id, produkt_id)
    unique('einheit_id_produkt_eindeutig').on(table.id, table.productId),
  ],
)
