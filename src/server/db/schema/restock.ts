// Nachkaufen-Liste (UMSETZUNG M1-06, NK-01 bis NK-04, #201). Name nachkauf_eintrag statt
// einkaufsliste_eintrag (Freigabe W7). Ein Eintrag betrifft eine Warengruppe (abgehakte oder
// ausgeblendete Lücke bis zum Ziel), ein Produkt oder nur einen freien Text.
import { sql } from 'drizzle-orm'
import { check, index, numeric, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { RESTOCK_SOURCES, RESTOCK_STATUSES, RESTOCK_UNITS } from '../../../shared/config/constants'
import { id, isOneOf, timestamps, timestampTz } from './columns'
import { households } from './household'
import { products } from './inventory'
import { productGroups } from './recommendation'

export const restockItems = pgTable(
  'nachkauf_eintrag',
  {
    id: id(),
    householdId: uuid('haushalt_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    productGroupId: uuid('warengruppe_id').references(() => productGroups.id, {
      onDelete: 'set null',
    }),
    productId: uuid('produkt_id').references(() => products.id, { onDelete: 'set null' }),
    label: text('bezeichnung').notNull(),
    // Bei einer Lücke die Fehlmenge beim Abhaken bzw. Ausblenden (Momentaufnahme)
    amount: numeric('menge', { precision: 9, scale: 2 }),
    unit: text('mass_einheit', { enum: RESTOCK_UNITS }),
    source: text('quelle', { enum: RESTOCK_SOURCES }).notNull(),
    status: text('status', { enum: RESTOCK_STATUSES }).notNull().default('offen'),
    // Seit wann erledigt bzw. ausgeblendet; leer genau dann, wenn offen
    doneAt: timestampTz('erledigt_am'),
    ...timestamps(),
  },
  (table) => [
    index('nachkauf_eintrag_haushalt_id_idx').on(table.householdId),
    // Je Warengruppe höchstens eine abgehakte und eine ausgeblendete Lücke; eine neue ersetzt sie
    uniqueIndex('nachkauf_eintrag_ziel_eindeutig')
      .on(table.householdId, table.productGroupId, table.status)
      .where(sql`${table.source} = 'ziel'`),
    check('nachkauf_eintrag_quelle_check', isOneOf(table.source, RESTOCK_SOURCES)),
    check('nachkauf_eintrag_status_check', isOneOf(table.status, RESTOCK_STATUSES)),
    // Eine Lücke ist nie offen gespeichert, ausgeblendet werden nur Lücken
    check(
      'nachkauf_eintrag_ziel_status_check',
      sql`(${table.source} = 'ziel' and ${table.status} <> 'offen') or (${table.source} <> 'ziel' and ${table.status} <> 'ausgeblendet')`,
    ),
    check(
      'nachkauf_eintrag_erledigt_am_check',
      sql`(${table.status} = 'offen') = (${table.doneAt} is null)`,
    ),
    check('nachkauf_eintrag_mass_einheit_check', isOneOf(table.unit, RESTOCK_UNITS)),
    check(
      'nachkauf_eintrag_menge_check',
      sql`(${table.amount} is null) = (${table.unit} is null) and (${table.amount} is null or ${table.amount} > 0)`,
    ),
  ],
)
