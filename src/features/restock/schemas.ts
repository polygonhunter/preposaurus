// Schemas der Nachkaufen-Liste (#72, #73): Eingaben der Actions und das DTO der Seite. Die Lücken
// bis zum Ziel kommen schon gerechnet, die Oberfläche formatiert nur noch.
import { z } from 'zod'
import { RESTOCK_SOURCES } from '@/shared/config/constants'

const id = z.uuid()

/** Ein eigener Eintrag ist ein kurzer Name („Knäckebrot“), keine Einkaufslisten-App. */
export const RESTOCK_LABEL_MAX_LENGTH = 80

export const newRestockItemSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, 'Bitte tragt ein, was auf die Liste soll.')
    .max(RESTOCK_LABEL_MAX_LENGTH, `Höchstens ${String(RESTOCK_LABEL_MAX_LENGTH)} Zeichen.`),
})

export const restockItemIdSchema = id

export const restockItemDoneSchema = z.object({ id, isDone: z.boolean() })
export type RestockItemDone = z.infer<typeof restockItemDoneSchema>

const gapSchema = z.object({
  groupKey: z.string(),
  name: z.string(),
  missing: z.object({ value: z.number().positive(), unit: z.enum(['g', 'ml']) }),
  days: z.number().nonnegative(),
  goalDays: z.number().int().positive(),
})

const itemSchema = z.object({
  id,
  label: z.string(),
  source: z.enum(RESTOCK_SOURCES),
  isDone: z.boolean(),
})

/** @internal Nur Tests prüfen das DTO gegen das Schema, die Seite nutzt die Typen. */
export const restockListSchema = z.object({
  /** false ohne Ziel oder Empfehlung: Dann rechnet die App keine Lücken */
  isGoalCalculable: z.boolean(),
  gaps: z.array(gapSchema),
  replace: z.array(itemSchema),
  own: z.array(itemSchema),
  done: z.array(itemSchema),
  openCount: z.number().int().nonnegative(),
})

export type RestockListDto = z.infer<typeof restockListSchema>
export type RestockGapDto = z.infer<typeof gapSchema>
export type RestockItemDto = z.infer<typeof itemSchema>
