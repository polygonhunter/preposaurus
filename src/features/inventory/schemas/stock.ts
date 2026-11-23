// Ausgaben der Vorrat-Ebenen 1 und 2, des Baums neben dem Detail und des Treffermodus (#43, #125).
import { z } from 'zod'
import {
  STOCK_STATUS_FILTERS,
  coverageSchema,
  groupRef,
  inStockCountsSchema,
  incompleteReasonSchema,
  namedRef,
  nodeTotalsSchema,
  stockRowSchema,
} from './shared'

// ---------- 1 · Vorrat-Übersicht (Ebene 1) ----------

/** @internal Nur Tests prüfen die Ausgabe gegen das Schema, die Seiten nutzen die Typen. */
export const stockOverviewSchema = z.object({
  groups: z.array(
    groupRef.extend({
      totals: nodeTotalsSchema,
      /** null ohne Ziel, ohne aktive Quelle oder ohne Zielmenge für diese Gruppe */
      coverage: coverageSchema.nullable(),
    }),
  ),
  goalDays: z.number().int().nullable(),
  /** Zähler der Zustands-Chips über den ganzen Vorrat (#221) */
  counts: inStockCountsSchema,
})

// ---------- 2 · Lebensmittelarten einer Warengruppe (Ebene 2) ----------

/** @internal Nur Tests prüfen die Ausgabe gegen das Schema, die Seiten nutzen die Typen. */
export const foodTypeLevelSchema = z.object({
  group: groupRef.extend({ totals: nodeTotalsSchema }),
  categories: z.array(
    namedRef.extend({
      pictogram: z.string().nullable(),
      totals: nodeTotalsSchema,
      rows: z.array(stockRowSchema),
    }),
  ),
})

/**
 * Alle Warengruppen wie Ebene 2, für Liste und Tabelle neben dem Detail (M12-03, M12-04).
 * @internal Nur Tests prüfen die Ausgabe gegen das Schema, die Seiten nutzen die Typen.
 */
export const stockTreeSchema = z.object({ groups: z.array(foodTypeLevelSchema) })

// ---------- 5 · Filter und Suche (Treffermodus) ----------

/** @internal Nur Tests prüfen die Ausgabe gegen das Schema, die Seiten nutzen die Typen. */
export const stockSearchSchema = z.object({
  counts: z.record(z.enum(STOCK_STATUS_FILTERS), z.number().int()),
  groups: z.array(
    groupRef.extend({
      rows: z.array(
        stockRowSchema.extend({
          matchingPackages: z.number().int(),
          /** Was nachzutragen ist, nach Gewicht, je Grund in Packungen (#221). Vollständig: leer */
          incomplete: z.array(
            z.object({ reason: incompleteReasonSchema, packages: z.number().int() }),
          ),
        }),
      ),
    }),
  ),
  options: z.object({ containers: z.array(namedRef), storageLocations: z.array(namedRef) }),
})

export type StockOverview = z.infer<typeof stockOverviewSchema>
export type FoodTypeLevel = z.infer<typeof foodTypeLevelSchema>
export type StockTree = z.infer<typeof stockTreeSchema>
export type StockSearch = z.infer<typeof stockSearchSchema>
export type StockSearchRow = StockSearch['groups'][number]['rows'][number]
