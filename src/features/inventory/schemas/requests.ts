// Eingaben im Vorrat (#43, P14): Filter kommen aus der URL, Aktionen aus Formularen. Hier geprüft.
import { z } from 'zod'
import { STOCK_STATUS_FILTERS, dateKindSchema, id, isoDay, stockTargetSchema } from './shared'

const SEARCH_MAX_LENGTH = 100

export const stockFilterSchema = z.object({
  status: z.enum(STOCK_STATUS_FILTERS).default('in-stock'),
  search: z.string().trim().max(SEARCH_MAX_LENGTH).optional(),
  groupKey: z.string().trim().min(1).optional(),
  categoryId: id.optional(),
  containerId: id.optional(),
  storageLocationId: id.optional(),
})

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

/**
 * „Datum ändern“ bzw. „Datum nachtragen“ (#49, #116): ein eingegebenes Datum, nie geschätzt, mit
 * der gewählten Datumsart (#300).
 */
export const changeUnitDatesSchema = z.object({
  unitIds: z.array(id).min(1).max(MAX_UNITS_PER_REQUEST),
  bestBefore: z.object({ date: isoDay, precision: z.enum(['day', 'month', 'year']) }),
  kind: dateKindSchema,
})

/** Fehlerfassung endgültig löschen (#50): ein ganzes Produkt oder eine einzelne Packung. */
export const deleteEntrySchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('product'), productId: id }),
  z.object({ kind: z.literal('unit'), unitId: id }),
])

export type StockFilter = z.infer<typeof stockFilterSchema>
export type ConsumeRequest = z.infer<typeof consumeRequestSchema>
export type DeleteEntryRequest = z.infer<typeof deleteEntrySchema>
