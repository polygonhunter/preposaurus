// Schemas der Lesepfade im Vorrat (#43, #125, DATENKATALOG §8.2 „Lesen je Screen“). Eingaben
// kommen aus der URL (Filter stehen dort, P14) und werden hier geprüft. Die Ausgaben sind DTOs:
// schmal, ohne DB-Zeilen, Datumswerte als ISO-Text (JJJJ-MM-TT).
import { z } from 'zod'

const SEARCH_MAX_LENGTH = 100

// Zustands-Filter im Vorrat, Quelle der Werte für URL und Zähler (#43). Gespiegelt als Typ
// `StockStatusFilter` in inventory/domain/stock-filter.ts.
const STOCK_STATUS_FILTERS = [
  'in-stock',
  'due-soon',
  'expired',
  'incomplete',
  'consumed',
  'discarded',
] as const

const isoDay = z.iso.date()
const id = z.uuid()
const namedRef = z.object({ id, name: z.string() })
/** Warengruppe mit amtlichem Namen und kurzem Anzeigenamen für Titel und Navigation (#177) */
const groupRef = z.object({ key: z.string(), name: z.string(), shortName: z.string() })

// ---------- Eingaben ----------

/** Zeile im Vorrat: eine Lebensmittelart oder ein Produkt ohne Lebensmittelart. */
export const stockTargetSchema = z.object({ kind: z.enum(['food-type', 'product']), id })

export const stockFilterSchema = z.object({
  status: z.enum(STOCK_STATUS_FILTERS).default('in-stock'),
  search: z.string().trim().max(SEARCH_MAX_LENGTH).optional(),
  groupKey: z.string().trim().min(1).optional(),
  categoryId: id.optional(),
  containerId: id.optional(),
  storageLocationId: id.optional(),
})

export const dueSortSchema = z.enum(['date', 'location']).default('date')

/** „Verbraucht“: eine bestimmte Packung oder die nächste nach MHD aus einer Zeile („−1“, #46). */
export const consumeRequestSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('unit'), unitId: id }),
  z.object({ kind: z.literal('target'), target: stockTargetSchema }),
])

export const unitIdSchema = id

// Mehr Packungen mit einem Datum hat ein Eintrag auf Bald fällig nicht (Erfassung: höchstens 99)
const MAX_UNITS_PER_REQUEST = 99

/** „Noch gut“ für alle Packungen eines Eintrags bzw. einer Datumszeile (#47). */
export const stillGoodRequestSchema = z.array(id).min(1).max(MAX_UNITS_PER_REQUEST)

/** Rückgängig nach „Noch gut“: die eben geprüften Packungen und der gesetzte Tag. */
export const undoStillGoodSchema = z.object({
  unitIds: stillGoodRequestSchema,
  checkedAt: isoDay,
})

// ---------- Bausteine ----------

const unitStateSchema = z.enum(['good', 'soon', 'urgent', 'expired', 'no-date'])

const bestBeforeSchema = z.object({
  date: isoDay,
  precision: z.enum(['day', 'month', 'year']),
  isEstimated: z.boolean(),
})

const macrosSchema = z.object({ protein: z.number(), carbs: z.number(), fat: z.number() })

/** Kennwerte eines Knotens, auf jeder Ebene gleich (UX-Konzept §2, #122). */
const nodeTotalsSchema = z.object({
  packages: z.number().int(),
  uncountedPackages: z.number().int(),
  amounts: z.object({ g: z.number(), ml: z.number() }),
  kcal: z.number(),
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

const stockRowSchema = z.object({
  target: stockTargetSchema,
  name: z.string(),
  pictogram: z.string().nullable(),
  /** Packungen im Vorrat, auch die heute nicht gezählten (abgelaufen) */
  packagesInStock: z.number().int(),
  state: unitStateSchema.nullable(),
  totals: nodeTotalsSchema,
})

const coverageSchema = z.object({
  unit: z.enum(['g', 'ml']),
  stock: z.number(),
  target: z.number(),
  days: z.number(),
  goalDays: z.number().int(),
  percent: z.number().int(),
  isTightest: z.boolean(),
})

// ---------- 1 · Vorrat-Übersicht (Ebene 1) ----------

export const stockOverviewSchema = z.object({
  groups: z.array(
    groupRef.extend({
      totals: nodeTotalsSchema,
      /** null ohne Ziel, ohne aktive Quelle oder ohne Zielmenge für diese Gruppe */
      coverage: coverageSchema.nullable(),
    }),
  ),
  goalDays: z.number().int().nullable(),
})

// ---------- 2 · Lebensmittelarten einer Warengruppe (Ebene 2) ----------

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

// ---------- 3 · Detail einer Lebensmittelart ----------

const valueOriginSchema = z.enum(['label', 'manual', 'ai-estimate', 'reference'])
const resolvedValueSchema = z.object({
  value: z.number().nullable(),
  origin: valueOriginSchema.nullable(),
})
const nutritionFields = <T extends z.ZodType>(schema: T) =>
  z.object({ kcal: schema, protein: schema, carbs: schema, fat: schema })

const nutritionSchema = z.object({
  source: z.enum(['label', 'manual', 'ai-estimate']).nullable(),
  isConfirmed: z.boolean(),
  per100: nutritionFields(resolvedValueSchema),
  perPackage: nutritionFields(z.number().nullable()),
  isKcalEstimated: z.boolean(),
  /** Grund für den Filter „Unvollständig“, null wenn nichts fehlt */
  gap: z.enum(['missing', 'no-label', 'unconfirmed']).nullable(),
})

const detailUnitSchema = z.object({
  id,
  kind: z.enum(['best-before', 'use-by']),
  checkedAt: isoDay.nullable(),
})

const bestBeforeGroupSchema = z.discriminatedUnion('kind', [
  bestBeforeSchema.extend({
    kind: z.literal('dated'),
    state: unitStateSchema,
    units: z.array(detailUnitSchema),
  }),
  z.object({ kind: z.literal('no-date'), units: z.array(detailUnitSchema) }),
])

export const foodTypeDetailSchema = z.object({
  target: stockTargetSchema,
  name: z.string(),
  path: z.object({
    group: groupRef,
    category: namedRef.extend({ pictogram: z.string().nullable() }),
  }),
  typicalShelfLifeMonths: z.number().int().nullable(),
  totals: nodeTotalsSchema,
  /** Packung für „1 entnehmen“ (frühestes MHD), null ohne Vorrat */
  fifoUnitId: id.nullable(),
  products: z.array(
    namedRef.extend({
      content: z.object({ value: z.number(), unit: z.enum(['g', 'ml']) }),
      container: namedRef.nullable(),
      storageLocation: namedRef.nullable(),
      nutrition: nutritionSchema,
      totals: nodeTotalsSchema,
      bestBeforeGroups: z.array(bestBeforeGroupSchema),
    }),
  ),
})

/** Eintrag im Verlauf einer Lebensmittelart (#48). Bei „Noch gut“ ist die Person unbekannt. */
export const historyEntrySchema = z.object({
  kind: z.enum(['consumed', 'discarded', 'still-good']),
  day: isoDay,
  person: z.string().nullable(),
  bestBefore: bestBeforeSchema.nullable(),
})

// ---------- 4 · Bald fällig ----------

const dueGroupSchema = z.enum(['expired', 'this-week', 'this-month', 'next-three-months'])

const dueEntrySchema = z.object({
  target: stockTargetSchema,
  name: z.string(),
  pictogram: z.string().nullable(),
  bestBefore: bestBeforeSchema.nullable(),
  kind: z.enum(['best-before', 'use-by']),
  /** Tage bis zum MHD, negativ wenn abgelaufen, null ohne Datum */
  daysLeft: z.number().int().nullable(),
  unitIds: z.array(id),
  productNames: z.array(z.string()),
  storageLocations: z.array(z.string()),
  canConfirmStillGood: z.boolean(),
})

export const dueUnitsSchema = z.object({
  thresholds: z.object({ soonDays: z.number().int(), urgentDays: z.number().int() }),
  counts: z.record(dueGroupSchema, z.number().int()),
  groups: z.array(z.object({ group: dueGroupSchema, entries: z.array(dueEntrySchema) })),
})

// ---------- 5 · Filter und Suche (Treffermodus) ----------

export const stockSearchSchema = z.object({
  counts: z.record(z.enum(STOCK_STATUS_FILTERS), z.number().int()),
  groups: z.array(
    groupRef.extend({
      rows: z.array(stockRowSchema.extend({ matchingPackages: z.number().int() })),
    }),
  ),
  options: z.object({ containers: z.array(namedRef), storageLocations: z.array(namedRef) }),
})

export type StockTarget = z.infer<typeof stockTargetSchema>
export type StockFilter = z.infer<typeof stockFilterSchema>
export type DueSort = z.infer<typeof dueSortSchema>
export type ConsumeRequest = z.infer<typeof consumeRequestSchema>
export type BestBeforeDto = z.infer<typeof bestBeforeSchema>
export type UnitStateDto = z.infer<typeof unitStateSchema>
export type DueGroupDto = z.infer<typeof dueGroupSchema>
export type NodeTotalsDto = z.infer<typeof nodeTotalsSchema>
export type StockRowDto = z.infer<typeof stockRowSchema>
export type StockOverview = z.infer<typeof stockOverviewSchema>
export type FoodTypeLevel = z.infer<typeof foodTypeLevelSchema>
export type FoodTypeDetail = z.infer<typeof foodTypeDetailSchema>
export type NutritionDto = z.infer<typeof nutritionSchema>
export type BestBeforeGroupDto = z.infer<typeof bestBeforeGroupSchema>
export type HistoryEntry = z.infer<typeof historyEntrySchema>
export type DueUnits = z.infer<typeof dueUnitsSchema>
export type DueEntry = z.infer<typeof dueEntrySchema>
export type StockSearch = z.infer<typeof stockSearchSchema>
