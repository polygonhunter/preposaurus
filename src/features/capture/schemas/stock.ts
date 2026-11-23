// Eingabe des Speicherns (#51), gleich für Foto und manuell (createStockAction).
// Die Grenzen folgen den Spalten: Mengen numeric(9,2), Nährwerte je 100 numeric(6,2).
import { z } from 'zod'
import { parseCalendarDay } from '@/shared/lib/dates'

const MAX_CONTENT = 9_999_999
export const MAX_PER_100 = 9_999
const MAX_NAME_LENGTH = 120
/** Schnellzahlen gehen bis 12, hochzählen darf weiter. Mehr in einem Chip ist ein Tippfehler. */
export const MAX_COUNT_PER_DATE = 99
export const MAX_DATES_PER_CAPTURE = 30

const calendarDay = z.string().transform((text, context) => {
  const day = parseCalendarDay(text)
  if (day !== null) return day
  context.addIssue({ code: 'custom', message: 'Kein gültiges Datum' })
  return z.NEVER
})

const unitEntrySchema = z.object({
  /** null heißt „Datum fehlt“ (#116) */
  bestBefore: z
    .object({
      date: calendarDay,
      precision: z.enum(['day', 'month', 'year']),
      isEstimated: z.boolean().default(false),
    })
    .nullable(),
  kind: z.enum(['best-before', 'use-by']).default('best-before'),
  count: z.int().min(1).max(MAX_COUNT_PER_DATE),
})

const per100 = z.number().min(0).max(MAX_PER_100).nullable()
const optionalId = z.uuid().nullable().default(null)

const contentSchema = z.object({
  value: z.number().positive().max(MAX_CONTENT),
  unit: z.enum(['g', 'ml']),
})

const newProductSchema = z.object({
  kind: z.literal('new'),
  foodTypeId: z.uuid(),
  name: z.string().trim().max(MAX_NAME_LENGTH).nullable().default(null),
  content: contentSchema,
  drainedWeightG: z.number().positive().max(MAX_CONTENT).nullable().default(null),
  containerId: optionalId,
  storageLocationId: optionalId,
  nutrition: z
    .object({
      kcal: per100,
      protein: per100,
      carbs: per100,
      fat: per100,
      source: z.enum(['label', 'manual', 'ai-estimate']),
      isConfirmed: z.boolean().default(false),
    })
    .nullable()
    .default(null),
})

export const createStockSchema = z.object({
  /** Idempotenz-Schlüssel: einmal je Erfassung auf dem Gerät erzeugt */
  captureId: z.uuid(),
  method: z.enum(['photo', 'manual']),
  /** Foto-Weg (#66): Die Fotos dieses Entwurfs werden fest, danach ist der Entwurf weg. */
  draftId: z.uuid().nullable().default(null),
  product: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('existing'), productId: z.uuid() }),
    newProductSchema,
  ]),
  units: z.array(unitEntrySchema).min(1).max(MAX_DATES_PER_CAPTURE),
})

/** Suche nach einem passenden Produkt für „Zu Spaghetti 500 g hinzufügen?“ */
export const productMatchQuerySchema = z.object({
  foodTypeId: z.uuid(),
  content: contentSchema,
  containerId: optionalId,
})

export type ProductMatchQuery = z.infer<typeof productMatchQuerySchema>
