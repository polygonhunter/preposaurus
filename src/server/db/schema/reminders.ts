// Erinnerungen je Nutzer (UMSETZUNG M1-06, ERI-01 und ERI-07): was er bekommt und auf welchen Geräten.
import { boolean, check, index, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core'
import { NOTIFICATION_KINDS } from '../../../shared/config/constants'
import { users } from './account'
import { id, isOneOf, timestamps } from './columns'

export const notificationSettings = pgTable(
  'benachrichtigung_einstellung',
  {
    id: id(),
    userId: uuid('nutzer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kind: text('art', { enum: NOTIFICATION_KINDS }).notNull(),
    isEnabled: boolean('aktiv').notNull().default(true),
    // Form legt das Schema der Einstellungen fest (z. B. Wochentag und Uhrzeit), M11.
    schedule: text('zeitplan'),
    ...timestamps(),
  },
  (table) => [
    unique('benachrichtigung_einstellung_eindeutig').on(table.userId, table.kind),
    check('benachrichtigung_einstellung_art_check', isOneOf(table.kind, NOTIFICATION_KINDS)),
  ],
)

// Ein Abo je Gerät. Läuft es ab, löscht der Worker die Zeile.
export const pushSubscriptions = pgTable(
  'push_abo',
  {
    id: id(),
    userId: uuid('nutzer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    device: text('geraet'),
    endpoint: text('endpoint').notNull().unique(),
    keyP256dh: text('schluessel_p256dh').notNull(),
    keyAuth: text('schluessel_auth').notNull(),
    ...timestamps(),
  },
  (table) => [index('push_abo_nutzer_id_idx').on(table.userId)],
)
