// Bestätigte Erfassung (DATENKATALOG §2.9). Ihre id ist der Idempotenz-Schlüssel des Speicherns:
// Ein zweites Bestätigen mit derselben id legt nichts doppelt an, auch nicht beim Nachschub zu
// einem bestehenden Produkt. Jede Einheit verweist auf die Erfassung, mit der sie dazukam.
// Wer zuletzt auf welchem Weg erfasst hat, belegt das nächste Erfassen vor, ohne persönliche
// Einstellungstabelle (Entscheidung E-4).
import { check, index, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { CAPTURE_METHODS } from '../../../shared/config/constants'
import { users } from './account'
import { id, isOneOf, timestamps } from './columns'
import { households } from './household'

export const captures = pgTable(
  'erfassung',
  {
    id: id(),
    householdId: uuid('haushalt_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    // Nutzer werden nie gelöscht, nur deaktiviert. NO ACTION statt RESTRICT, damit das Löschen
    // eines Haushalts Nutzer und Erfassungen gemeinsam per CASCADE entfernen kann.
    userId: uuid('nutzer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'no action' }),
    method: text('weg', { enum: CAPTURE_METHODS }).notNull(),
    ...timestamps(),
  },
  (table) => [
    index('erfassung_haushalt_id_idx').on(table.householdId),
    // „Zuletzt erfasst“ je Nutzer für die Vorbelegung
    index('erfassung_nutzer_erstellt_idx').on(table.userId, table.createdAt),
    check('erfassung_weg_check', isOneOf(table.method, CAPTURE_METHODS)),
  ],
)
