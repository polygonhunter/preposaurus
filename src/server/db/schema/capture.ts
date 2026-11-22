// Erfassung: Fotos, Entwürfe und KI-Aufrufe (UMSETZUNG M1-06, technik.html „Wann wird gespeichert“).
// Die Datei liegt im Foto-Volume, hier steht nur die Referenz. Ein Entwurf ist ein Vorschlag:
// Gespeichert wird das Produkt erst beim Bestätigen.
import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  uuid,
} from 'drizzle-orm/pg-core'
import { AI_ROLES } from '../../../shared/config/ai-roles'
import { PHOTO_ROLES, PHOTO_STATUSES } from '../../../shared/config/constants'
import { users } from './account'
import { aiConnections } from './ai-connections'
import { id, isOneOf, timestamps } from './columns'
import { households } from './household'
import { products, units } from './inventory'

export const captureDrafts = pgTable(
  'erfassung_entwurf',
  {
    id: id(),
    householdId: uuid('haushalt_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    userId: uuid('nutzer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // Form der Daten legt das Zod-Schema der Erfassung fest (M5/M6), nicht die DB.
    data: jsonb('daten').notNull().default({}),
    ...timestamps(),
  },
  (table) => [index('erfassung_entwurf_nutzer_id_idx').on(table.userId)],
)

export const photos = pgTable(
  'foto',
  {
    id: id(),
    householdId: uuid('haushalt_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    role: text('rolle', { enum: PHOTO_ROLES }).notNull(),
    path: text('pfad').notNull().unique(),
    hash: text('hash').notNull(),
    sizeBytes: integer('groesse_bytes').notNull(),
    mimeType: text('dateityp').notNull(),
    status: text('status', { enum: PHOTO_STATUSES }).notNull().default('entwurf'),
    // Wird ein Entwurf gelöscht, bleibt ein festes Foto stehen (nur der Verweis fällt weg).
    draftId: uuid('entwurf_id').references(() => captureDrafts.id, { onDelete: 'set null' }),
    productId: uuid('produkt_id').references(() => products.id, { onDelete: 'cascade' }),
    // MHD-Foto einer bestimmten Packung. Der einfache Fremdschlüssel leert den Verweis, wenn die
    // Einheit gelöscht wird. Der zusammengesetzte (unten) sichert, dass sie zum Produkt gehört.
    unitId: uuid('einheit_id').references(() => units.id, { onDelete: 'set null' }),
    ...timestamps(),
  },
  (table) => [
    index('foto_entwurf_id_idx').on(table.draftId),
    index('foto_produkt_id_idx').on(table.productId),
    foreignKey({
      name: 'foto_einheit_produkt_fk',
      columns: [table.unitId, table.productId],
      foreignColumns: [units.id, units.productId],
    }).onDelete('no action'),
    check('foto_rolle_check', isOneOf(table.role, PHOTO_ROLES)),
    check('foto_status_check', isOneOf(table.status, PHOTO_STATUSES)),
    check('foto_fest_check', sql`${table.status} <> 'fest' or ${table.productId} is not null`),
    check('foto_groesse_check', sql`${table.sizeBytes} > 0`),
  ],
)

// Protokoll für Kostenübersicht und Fehlschläge. Enthält nie Schlüssel oder Bildinhalte.
export const aiCalls = pgTable(
  'ki_aufruf',
  {
    id: id(),
    householdId: uuid('haushalt_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    photoId: uuid('foto_id').references(() => photos.id, { onDelete: 'set null' }),
    // Rolle und Verbindung, damit Kosten und Fehlerquote je Rolle auswertbar sind (PoC, #108).
    role: text('rolle', { enum: AI_ROLES }),
    connectionId: uuid('verbindung_id').references(() => aiConnections.id, {
      onDelete: 'set null',
    }),
    model: text('modell').notNull(),
    inputTokens: integer('tokens_ein'),
    outputTokens: integer('tokens_aus'),
    costUsd: numeric('kosten_usd', { precision: 10, scale: 6 }),
    durationMs: integer('dauer_ms'),
    isSuccess: boolean('erfolg').notNull(),
    errorKind: text('fehlerart'),
    ...timestamps(),
  },
  (table) => [
    index('ki_aufruf_haushalt_erstellt_idx').on(table.householdId, table.createdAt),
    check('ki_aufruf_rolle_check', isOneOf(table.role, AI_ROLES)),
  ],
)
