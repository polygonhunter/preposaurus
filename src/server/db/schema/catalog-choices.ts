// Was ein Haushalt an den Stammdaten selbst einstellt (#76, #126): ausgeblendete Kategorien und
// Lebensmittelarten sowie eigene Suchwörter. System-Einträge gehören allen Haushalten, deshalb steht
// das Ausblenden je Haushalt in eigenen Tabellen statt in der Spalte ausgeblendet (die setzt nur der
// Seed für entfallene Einträge). So blendet ein Haushalt nie etwas für einen anderen aus.
import { index, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core'
import { categories } from './catalog'
import { id, timestamps } from './columns'
import { foodTypes } from './food-types'
import { households } from './household'

export const hiddenCategories = pgTable(
  'kategorie_ausblendung',
  {
    id: id(),
    householdId: uuid('haushalt_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    categoryId: uuid('kategorie_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    ...timestamps(),
  },
  (table) => [
    unique('kategorie_ausblendung_eindeutig').on(table.householdId, table.categoryId),
    index('kategorie_ausblendung_kategorie_id_idx').on(table.categoryId),
  ],
)

export const hiddenFoodTypes = pgTable(
  'lebensmittelart_ausblendung',
  {
    id: id(),
    householdId: uuid('haushalt_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    foodTypeId: uuid('lebensmittelart_id')
      .notNull()
      .references(() => foodTypes.id, { onDelete: 'cascade' }),
    ...timestamps(),
  },
  (table) => [
    unique('lebensmittelart_ausblendung_eindeutig').on(table.householdId, table.foodTypeId),
    index('lebensmittelart_ausblendung_lebensmittelart_id_idx').on(table.foodTypeId),
  ],
)

// Suchwörter eigener Arten („Frühstücksflocken“ → eigene Art „Dinkelpops“). Die Suchwörter der
// System-Arten stehen als gepflegte Konstante im Code (capture/domain/food-type-search-terms.ts).
export const foodTypeSearchTerms = pgTable(
  'lebensmittelart_suchwort',
  {
    id: id(),
    foodTypeId: uuid('lebensmittelart_id')
      .notNull()
      .references(() => foodTypes.id, { onDelete: 'cascade' }),
    term: text('wort').notNull(),
    ...timestamps(),
  },
  (table) => [unique('lebensmittelart_suchwort_eindeutig').on(table.foodTypeId, table.term)],
)
