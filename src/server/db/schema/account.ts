// Konto: Tabellen von Better Auth unter deutschen Namen (UMSETZUNG M1-02, technik.html „Haushalt und Konto“).
// Better Auth findet die Tabellen über die Schlüssel im Drizzle-Adapter (user, session, account,
// verification) und die Felder über die Drizzle-Eigenschaften. Tabellen- und Spaltennamen in der
// DB bestimmt allein dieses Schema. Spalten, die nur Better Auth nutzt, behalten die englischen
// Namen der Bibliothek, unsere eigenen Spalten folgen dem deutschen Kanon.
// Anmeldung nur mit Benutzername und Passwort (Username-Plugin, EINSTELLUNGEN_NUTZER §6.1).
// Better Auth verlangt trotzdem eine eindeutige E-Mail (Kernschema: required, unique). Die App
// erzeugt dafür die technische Adresse <id>@nutzer.invalid und zeigt sie nie an.
// Passwörter liegen nur als scrypt-Hash von Better Auth in konto.password, nie im Klartext.
// Nutzer werden nie hart gelöscht, nur deaktiviert (aktiv = false), damit die Historie bleibt.
import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  index,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'
import { USER_ROLES } from '../../../shared/config/constants'
import { id, isOneOf, timestamps, timestampTz } from './columns'
import { households, members } from './household'

export const users = pgTable(
  'nutzer',
  {
    id: id(),
    // Anzeigename
    name: text('name').notNull(),
    // Klein gespeichert (das Plugin normalisiert), 3–30 Zeichen: a–z, 0–9, Punkt, Unterstrich.
    username: text('benutzername').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').notNull().default(false),
    image: text('image'),
    role: text('rolle', { enum: USER_ROLES }).notNull().default('mitglied'),
    isActive: boolean('aktiv').notNull().default(true),
    // Leer erlaubt, damit Better Auth den Nutzer anlegen kann, bevor die Einrichtung ihn zuordnet (M3).
    householdId: uuid('haushalt_id').references(() => households.id, { onDelete: 'cascade' }),
    memberId: uuid('mitglied_id')
      .unique()
      .references(() => members.id, { onDelete: 'set null' }),
    // Vom Admin oder per Kommandozeile vergeben und noch nicht selbst geändert
    isPasswordTemporary: boolean('passwort_vorlaeufig').notNull().default(false),
    passwordChangedAt: timestampTz('passwort_geaendert_am'),
    // Leer, wenn es per Kommandozeile gesetzt wurde
    passwordChangedBy: uuid('passwort_geaendert_von').references((): AnyPgColumn => users.id, {
      onDelete: 'set null',
    }),
    // Eigene Spalte, weil Sitzungen gelöscht werden
    lastSignInAt: timestampTz('letzte_anmeldung_am'),
    aiNoticeConfirmedAt: timestampTz('ki_hinweis_bestaetigt_am'),
    ...timestamps(),
  },
  (table) => [
    check('nutzer_rolle_check', isOneOf(table.role, USER_ROLES)),
    check('nutzer_benutzername_check', sql`${table.username} ~ '^[a-z0-9._]{3,30}$'`),
    // Eindeutig ohne Rücksicht auf Groß- und Kleinschreibung, auch wenn ein Weg am Plugin vorbei schreibt.
    uniqueIndex('nutzer_benutzername_eindeutig').on(sql`lower(${table.username})`),
  ],
)

export const sessions = pgTable(
  'sitzung',
  {
    id: id(),
    token: text('token').notNull().unique(),
    expiresAt: timestampTz('expires_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: uuid('nutzer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ...timestamps(),
  },
  (table) => [index('sitzung_nutzer_id_idx').on(table.userId)],
)

export const accounts = pgTable(
  'konto',
  {
    id: id(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: uuid('nutzer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestampTz('access_token_expires_at'),
    refreshTokenExpiresAt: timestampTz('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    ...timestamps(),
  },
  (table) => [index('konto_nutzer_id_idx').on(table.userId)],
)

export const verifications = pgTable(
  'verifizierung',
  {
    id: id(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestampTz('expires_at').notNull(),
    ...timestamps(),
  },
  (table) => [index('verifizierung_identifier_idx').on(table.identifier)],
)
