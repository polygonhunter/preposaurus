// Nachkaufen-Liste (UMSETZUNG M1-06, NK-01 bis NK-04). Name nachkauf_eintrag statt
// einkaufsliste_eintrag (Freigabe W7). Ein Eintrag betrifft eine Warengruppe, ein Produkt oder
// nur einen freien Text.
import { sql } from 'drizzle-orm'
import { boolean, check, index, numeric, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { RESTOCK_SOURCES, RESTOCK_UNITS } from '../../../shared/config/constants'
import { id, isOneOf, timestamps } from './columns'
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
    amount: numeric('menge', { precision: 9, scale: 2 }),
    unit: text('mass_einheit', { enum: RESTOCK_UNITS }),
    source: text('quelle', { enum: RESTOCK_SOURCES }).notNull(),
    isDone: boolean('erledigt').notNull().default(false),
    ...timestamps(),
  },
  (table) => [
    index('nachkauf_eintrag_haushalt_id_idx').on(table.householdId),
    check('nachkauf_eintrag_quelle_check', isOneOf(table.source, RESTOCK_SOURCES)),
    check('nachkauf_eintrag_mass_einheit_check', isOneOf(table.unit, RESTOCK_UNITS)),
    check(
      'nachkauf_eintrag_menge_check',
      sql`(${table.amount} is null) = (${table.unit} is null) and (${table.amount} is null or ${table.amount} > 0)`,
    ),
  ],
)
