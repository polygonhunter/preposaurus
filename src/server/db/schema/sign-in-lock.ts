// Anmeldebremse (EINSTELLUNGEN_NUTZER §6.2): zählt Fehlversuche je Benutzername und je IP-Adresse.
// Kein Fremdschlüssel auf nutzer, weil auch unbekannte Namen gezählt werden. Der Schlüssel global
// zählt alle Versuche zusammen, damit wechselnde Adressen nicht weiterhelfen (Review #138).
import { sql } from 'drizzle-orm'
import { check, integer, pgTable, text } from 'drizzle-orm/pg-core'
import { id, timestamps, timestampTz } from './columns'

export const signInLocks = pgTable(
  'anmelde_sperre',
  {
    id: id(),
    // name:<benutzername>, ip:<adresse> (ip:unbekannt ohne Adresse) oder global
    key: text('schluessel').notNull().unique(),
    failedAttempts: integer('fehlversuche').notNull().default(0),
    lastFailedAt: timestampTz('letzter_fehlversuch_am'),
    lockedUntil: timestampTz('gesperrt_bis'),
    ...timestamps(),
  },
  (table) => [
    check('anmelde_sperre_schluessel_check', sql`${table.key} ~ '^((name|ip):.+|global)$'`),
    check('anmelde_sperre_fehlversuche_check', sql`${table.failedAttempts} >= 0`),
  ],
)
