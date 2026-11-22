// KI-Verbindungen und ihre Zuweisung je Foto-Rolle (Issue #108). Ein Haushalt kann mehrere
// Verbindungen anlegen (z. B. zwei Anthropic-Schlüssel, später ein lokales Modell) und jeder Rolle
// eine Verbindung mit Modell zuweisen. Der haushaltsweite Schalter bleibt haushalt_einstellung.ki_aktiv.
// Nur das Schema: Verschlüsselung (AES-256-GCM mit APP_SECRET) und Oberfläche kommen mit M9.
// Der Schlüssel steht nie im Klartext in der DB, sondern als Chiffrat, IV und Auth-Tag (Base64).
import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  foreignKey,
  integer,
  pgTable,
  text,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
import { AI_ROLES } from '../../../shared/config/ai-roles'
import { AI_CONNECTION_STATUSES, AI_PROVIDERS } from '../../../shared/config/constants'
import { id, isOneOf, timestamps, timestampTz } from './columns'
import { households } from './household'

const KEY_HINT_MAX_LENGTH = 4

export const aiConnections = pgTable(
  'ki_verbindung',
  {
    id: id(),
    householdId: uuid('haushalt_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    provider: text('anbieter', { enum: AI_PROVIDERS }).notNull(),
    name: text('name').notNull(),
    // Leer erlaubt, weil ein lokales Modell keinen Schlüssel braucht.
    apiKeyCiphertext: text('schluessel_chiffrat'),
    apiKeyIv: text('schluessel_iv'),
    apiKeyAuthTag: text('schluessel_tag'),
    // Letzte 4 Zeichen für die maskierte Anzeige (z. B. „…4f2a“), ohne zu entschlüsseln.
    apiKeyHint: text('schluessel_hinweis'),
    // Version des Server-Geheimnisses, mit dem verschlüsselt wurde (für einen späteren Schlüsselwechsel).
    apiKeyVersion: integer('schluessel_version'),
    baseUrl: text('basis_url'),
    lastTestStatus: text('letzter_test_status', { enum: AI_CONNECTION_STATUSES }),
    lastTestedAt: timestampTz('letzter_test_am'),
    isActive: boolean('aktiv').notNull().default(true),
    ...timestamps(),
  },
  (table) => [
    unique('ki_verbindung_name_eindeutig').on(table.householdId, table.name),
    // Ziel des zusammengesetzten Fremdschlüssels aus ki_rollen_zuweisung (gleicher Haushalt).
    unique('ki_verbindung_id_haushalt_eindeutig').on(table.id, table.householdId),
    check('ki_verbindung_anbieter_check', isOneOf(table.provider, AI_PROVIDERS)),
    check('ki_verbindung_test_status_check', isOneOf(table.lastTestStatus, AI_CONNECTION_STATUSES)),
    // Chiffrat, IV, Tag, Hinweis und Version gibt es nur zusammen.
    check(
      'ki_verbindung_schluessel_check',
      sql`(${table.apiKeyCiphertext} is null) = (${table.apiKeyIv} is null)
        and (${table.apiKeyIv} is null) = (${table.apiKeyAuthTag} is null)
        and (${table.apiKeyAuthTag} is null) = (${table.apiKeyHint} is null)
        and (${table.apiKeyHint} is null) = (${table.apiKeyVersion} is null)`,
    ),
    check(
      'ki_verbindung_hinweis_check',
      sql`char_length(${table.apiKeyHint}) <= ${sql.raw(String(KEY_HINT_MAX_LENGTH))}`,
    ),
    check(
      'ki_verbindung_test_check',
      sql`(${table.lastTestStatus} is null) = (${table.lastTestedAt} is null)`,
    ),
  ],
)

// Eine Zuweisung je Rolle und Haushalt. Die Verbindung ist Pflicht und lässt sich nicht löschen,
// solange eine Rolle sie nutzt: Sonst fiele die Foto-Erkennung für die Rolle still aus. Wer eine
// Verbindung entfernen will, weist die Rollen vorher neu zu. NO ACTION statt RESTRICT, weil NO
// ACTION erst am Ende der Anweisung prüft: Löscht man den ganzen Haushalt, verschwinden Verbindung
// und Zuweisung per CASCADE gemeinsam, ohne dass die Reihenfolge eine Rolle spielt.
export const aiRoleAssignments = pgTable(
  'ki_rollen_zuweisung',
  {
    id: id(),
    householdId: uuid('haushalt_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    role: text('rolle', { enum: AI_ROLES }).notNull(),
    connectionId: uuid('verbindung_id').notNull(),
    model: text('modell').notNull(),
    isActive: boolean('aktiv').notNull().default(true),
    ...timestamps(),
  },
  (table) => [
    unique('ki_rollen_zuweisung_eindeutig').on(table.householdId, table.role),
    check('ki_rollen_zuweisung_rolle_check', isOneOf(table.role, AI_ROLES)),
    // Verbindung aus demselben Haushalt
    foreignKey({
      name: 'ki_rollen_zuweisung_verbindung_fk',
      columns: [table.connectionId, table.householdId],
      foreignColumns: [aiConnections.id, aiConnections.householdId],
    }).onDelete('no action'),
  ],
)
