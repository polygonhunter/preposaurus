// Konto: Tabellen von Better Auth unter deutschen Namen (UMSETZUNG M1-02, technik.html „Haushalt und Konto“).
// Better Auth findet die Tabellen über die Schlüssel im Drizzle-Adapter (user, session, account,
// verification) und die Felder über die Drizzle-Eigenschaften. Tabellen- und Spaltennamen in der
// DB bestimmt allein dieses Schema. Spalten, die nur Better Auth nutzt, behalten die englischen
// Namen der Bibliothek, unsere eigenen Spalten folgen dem deutschen Kanon.
import { boolean, check, index, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { USER_ROLES } from '../../../shared/config/constants'
import { id, isOneOf, timestamps, timestampTz } from './columns'
import { households, members } from './household'

export const users = pgTable(
  'nutzer',
  {
    id: id(),
    name: text('name').notNull(),
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
    ...timestamps(),
  },
  (table) => [check('nutzer_rolle_check', isOneOf(table.role, USER_ROLES))],
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
