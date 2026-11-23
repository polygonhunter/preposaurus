// Ausgaben im Detail einer Lebensmittelart: Kennwerte, Produkte, Verlauf (#48) und die Datumszeile
// für „Datum ändern“ (#49).
import { z } from 'zod'
import {
  bestBeforeSchema,
  groupRef,
  id,
  isoDay,
  namedRef,
  nodeTotalsSchema,
  stockTargetSchema,
  unitStateSchema,
} from './shared'

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

/** @internal Nur Tests prüfen die Ausgabe gegen das Schema, die Seiten nutzen die Typen. */
export const foodTypeDetailSchema = z.object({
  target: stockTargetSchema,
  name: z.string(),
  path: z.object({
    group: groupRef,
    category: namedRef.extend({ pictogram: z.string().nullable() }),
  }),
  typicalShelfLifeMonths: z.number().int().nullable(),
  totals: nodeTotalsSchema,
  /** Tagesbedarf des Haushalts für das Erklär-Blatt der Kennwerte (#230), ohne Bedarf 0 */
  need: z.object({ kcalPerDay: z.number().nonnegative(), waterMlPerDay: z.number().nonnegative() }),
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

/**
 * Eintrag im Verlauf einer Lebensmittelart (#48). Bei „Noch gut“ ist die Person unbekannt.
 * @internal Nur Tests prüfen die Ausgabe gegen das Schema, die Seiten nutzen die Typen.
 */
export const historyEntrySchema = z.object({
  kind: z.enum(['consumed', 'discarded', 'still-good']),
  day: isoDay,
  person: z.string().nullable(),
  bestBefore: bestBeforeSchema.nullable(),
})

/**
 * Datumszeile für „Datum ändern“ (#49): alle Packungen eines Produkts mit diesem Datum.
 * @internal Nur Tests prüfen die Ausgabe gegen das Schema, die Seiten nutzen die Typen.
 */
export const unitDateGroupSchema = z.object({
  target: stockTargetSchema,
  name: z.string(),
  productName: z.string(),
  bestBefore: bestBeforeSchema.nullable(),
  kind: z.enum(['best-before', 'use-by']),
  unitIds: z.array(id).min(1),
  /** Packungen der Zeile mit „Noch gut“, das mit einem neuen Datum entfällt */
  checkedCount: z.number().int(),
})

export type FoodTypeDetail = z.infer<typeof foodTypeDetailSchema>
export type NutritionDto = z.infer<typeof nutritionSchema>
export type BestBeforeGroupDto = z.infer<typeof bestBeforeGroupSchema>
export type HistoryEntry = z.infer<typeof historyEntrySchema>
export type UnitDateGroup = z.infer<typeof unitDateGroupSchema>
