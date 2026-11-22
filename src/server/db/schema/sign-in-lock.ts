// Anmeldebremse (EINSTELLUNGEN_NUTZER §6.2): zählt Fehlversuche je Benutzername und je IP-Adresse.
// Kein Fremdschlüssel auf nutzer, weil auch unbekannte Namen gezählt werden.
import { sql } from 'drizzle-orm'
import { check, integer, pgTable, text } from 'drizzle-orm/pg-core'
import { id, timestamps, timestampTz } from './columns'

export const signInLocks = pgTable(
  'anmelde_sperre',
  {
    id: id(),
    // name:<benutzername> oder ip:<adresse>
    key: text('schluessel').notNull().unique(),
    failedAttempts: integer('fehlversuche').notNull().default(0),
    lastFailedAt: timestampTz('letzter_fehlversuch_am'),
    lockedUntil: timestampTz('gesperrt_bis'),
    ...timestamps(),
  },
  (table) => [
    check('anmelde_sperre_schluessel_check', sql`${table.key} ~ '^(name|ip):.+$'`),
    check('anmelde_sperre_fehlversuche_check', sql`${table.failedAttempts} >= 0`),
  ],
)
