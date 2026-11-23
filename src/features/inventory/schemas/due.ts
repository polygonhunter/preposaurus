// Ausgabe von „Bald fällig“ (#44).
import { z } from 'zod'
import { bestBeforeSchema, id, stockTargetSchema } from './shared'

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

/** @internal Nur Tests prüfen die Ausgabe gegen das Schema, die Seiten nutzen die Typen. */
export const dueUnitsSchema = z.object({
  thresholds: z.object({ soonDays: z.number().int(), urgentDays: z.number().int() }),
  counts: z.record(dueGroupSchema, z.number().int()),
  groups: z.array(z.object({ group: dueGroupSchema, entries: z.array(dueEntrySchema) })),
})

/** Sortierung von „Bald fällig“. Die Seite liest sie über readDueSort aus der Adresse. */
export type DueSort = 'date' | 'location'
export type DueGroupDto = z.infer<typeof dueGroupSchema>
export type DueUnits = z.infer<typeof dueUnitsSchema>
export type DueEntry = z.infer<typeof dueEntrySchema>
