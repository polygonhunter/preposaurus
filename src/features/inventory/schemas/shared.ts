// Bausteine der Lesepfade im Vorrat (#43, #125, DATENKATALOG §8.2 „Lesen je Screen“), geteilt von
// den Schema-Dateien dieses Ordners (#175). Die Ausgaben sind DTOs: schmal, ohne DB-Zeilen,
// Datumswerte als ISO-Text (JJJJ-MM-TT).
import { z } from 'zod'

// Zustands-Filter im Vorrat, Quelle der Werte für URL und Zähler (#43). Gespiegelt als Typ
// `StockStatusFilter` in inventory/domain/stock-filter.ts. Verbraucht und Entsorgt stehen im
// Verlauf (#48, D7), siehe schemas/history.ts.
export const STOCK_STATUS_FILTERS = ['in-stock', 'due-soon', 'expired', 'incomplete'] as const

/** Zähler der Zustands-Chips in Packungen, auf jeder Seite mit Chips (#221) */
export const inStockCountsSchema = z.record(z.enum(STOCK_STATUS_FILTERS), z.number().int())

/** Gründe im Filter „Unvollständig“ (#221), gespiegelt als `IncompleteReason` (domain/incomplete.ts) */
export const incompleteReasonSchema = z.enum([
  'nutrition-missing',
  'date-missing',
  'estimate-unconfirmed',
])

export const isoDay = z.iso.date()
/** MHD oder Verbrauchsdatum, gespiegelt als `DateKind` (domain/unit.ts) */
export const dateKindSchema = z.enum(['best-before', 'use-by'])
export const id = z.uuid()
export const namedRef = z.object({ id, name: z.string() })
/** Warengruppe mit amtlichem Namen und kurzem Anzeigenamen für Titel und Navigation (#177) */
export const groupRef = z.object({ key: z.string(), name: z.string(), shortName: z.string() })

/** Zeile im Vorrat: eine Lebensmittelart oder ein Produkt ohne Lebensmittelart. */
export const stockTargetSchema = z.object({ kind: z.enum(['food-type', 'product']), id })

export const unitStateSchema = z.enum(['good', 'soon', 'urgent', 'expired', 'no-date'])

export const bestBeforeSchema = z.object({
  date: isoDay,
  precision: z.enum(['day', 'month', 'year']),
  isEstimated: z.boolean(),
})

const macrosSchema = z.object({ protein: z.number(), carbs: z.number(), fat: z.number() })

/** Kennwerte eines Knotens, auf jeder Ebene gleich (UX-Konzept §2, #122). */
export const nodeTotalsSchema = z.object({
  packages: z.number().int(),
  uncountedPackages: z.number().int(),
  amounts: z.object({ g: z.number(), ml: z.number() }),
  kcal: z.number(),
  /** Wasser in ml, das in die Wasser-Tage zählt */
  waterMl: z.number(),
  macros: macrosSchema,
  productsWithoutMacros: z.number().int(),
  energyDays: z.number().nullable(),
  waterDays: z.number().nullable(),
  nextBestBefore: bestBeforeSchema.nullable(),
  /** Zustand des nächsten MHD, null ohne Datum */
  nextState: unitStateSchema.nullable(),
  withoutDate: z.number().int(),
  estimatedKcalShare: z.number(),
  isApproximate: z.boolean(),
})

export const stockRowSchema = z.object({
  target: stockTargetSchema,
  name: z.string(),
  pictogram: z.string().nullable(),
  /** Packungen im Vorrat, auch die heute nicht gezählten (abgelaufen) */
  packagesInStock: z.number().int(),
  state: unitStateSchema.nullable(),
  totals: nodeTotalsSchema,
})

export const coverageSchema = z.object({
  unit: z.enum(['g', 'ml']),
  stock: z.number(),
  target: z.number(),
  days: z.number(),
  goalDays: z.number().int(),
  percent: z.number().int(),
  isTightest: z.boolean(),
})

export type StockTarget = z.infer<typeof stockTargetSchema>
export type BestBeforeDto = z.infer<typeof bestBeforeSchema>
export type UnitStateDto = z.infer<typeof unitStateSchema>
export type NodeTotalsDto = z.infer<typeof nodeTotalsSchema>
export type StockRowDto = z.infer<typeof stockRowSchema>
export type InStockCounts = z.infer<typeof inStockCountsSchema>
export type IncompleteReasonDto = z.infer<typeof incompleteReasonSchema>
