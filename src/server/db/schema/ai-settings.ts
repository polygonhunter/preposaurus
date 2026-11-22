// KI-Anbindung je Haushalt (Issue #108): Anbieter, verschlüsselter API-Schlüssel, Modell je
// Foto-Rolle und letzter Verbindungstest. Nur das Schema: Verschlüsselung (AES-256-GCM mit
// APP_SECRET) und Oberfläche kommen mit M9. Der Schlüssel steht nie im Klartext in der DB,
// sondern als Chiffrat mit IV und Auth-Tag, jeweils Base64.
// Ersetzt für die Modelle die Planungsentscheidung „KI-Modell nur über .env“ (Grundentscheidung 11).
import { sql } from 'drizzle-orm'
import { check, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { AI_CONNECTION_STATUSES, AI_PROVIDERS } from '../../../shared/config/constants'
import { id, isOneOf, timestamps, timestampTz } from './columns'
import { households } from './household'

export const aiSettings = pgTable(
  'ki_einstellung',
  {
    id: id(),
    householdId: uuid('haushalt_id')
      .notNull()
      .unique()
      .references(() => households.id, { onDelete: 'cascade' }),
    provider: text('anbieter', { enum: AI_PROVIDERS }).notNull().default('anthropic'),
    apiKeyCiphertext: text('schluessel_chiffrat'),
    apiKeyIv: text('schluessel_iv'),
    apiKeyAuthTag: text('schluessel_tag'),
    // Leer heißt: Standard aus der Umgebung (AI_MODEL_*). Ein Wert in .env hat Vorrang.
    modelPackaging: text('modell_verpackung'),
    modelNutrition: text('modell_naehrwerte'),
    modelBestBefore: text('modell_mhd'),
    lastTestStatus: text('letzter_test_status', { enum: AI_CONNECTION_STATUSES }),
    lastTestedAt: timestampTz('letzter_test_am'),
    ...timestamps(),
  },
  (table) => [
    check('ki_einstellung_anbieter_check', isOneOf(table.provider, AI_PROVIDERS)),
    check(
      'ki_einstellung_test_status_check',
      isOneOf(table.lastTestStatus, AI_CONNECTION_STATUSES),
    ),
    // Chiffrat, IV und Tag gibt es nur zusammen, sonst ließe sich der Schlüssel nicht entschlüsseln.
    check(
      'ki_einstellung_schluessel_check',
      sql`(${table.apiKeyCiphertext} is null) = (${table.apiKeyIv} is null) and (${table.apiKeyIv} is null) = (${table.apiKeyAuthTag} is null)`,
    ),
    check(
      'ki_einstellung_test_check',
      sql`(${table.lastTestStatus} is null) = (${table.lastTestedAt} is null)`,
    ),
  ],
)
