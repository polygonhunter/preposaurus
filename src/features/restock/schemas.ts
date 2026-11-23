// Schemas der Nachkaufen-Liste (#72, #73, #200, #202): Eingaben der Actions und das DTO der Seite.
// Lücken und Vorschläge kommen schon gerechnet, die Oberfläche formatiert nur noch.
import { z } from 'zod'
import { RESTOCK_SOURCES } from '@/shared/config/constants'

const id = z.uuid()

/** Ein eigener Eintrag ist ein kurzer Name („Knäckebrot“), keine Einkaufslisten-App. */
export const RESTOCK_LABEL_MAX_LENGTH = 80
const REMOVED_LABEL_MAX_LENGTH = 200

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

/** Ein Vorschlag unter „Ersetzen“ kommt über sein Produkt auf die Liste. */
export const suggestedProductIdSchema = id

/**
 * Ein eben entfernter Eintrag, wie ihn die Action zurückgibt. „Rückgängig“ schickt ihn zurück; die
 * Action prüft ihn erneut, weil sie per POST direkt aufrufbar ist. Namen aus Lebensmittelarten
 * können länger sein als ein eigener Eintrag, deshalb hier nur eine großzügige Grenze.
 */
export const removedRestockItemSchema = z.object({
  id,
  label: z.string().trim().min(1).max(REMOVED_LABEL_MAX_LENGTH),
  source: z.enum(RESTOCK_SOURCES),
  productId: id.nullable(),
  isDone: z.boolean(),
  createdAt: z.iso.datetime(),
})
export type RemovedRestockItem = z.infer<typeof removedRestockItemSchema>

const gapSchema = z.object({
  groupKey: z.string(),
  name: z.string(),
  missing: z.object({ value: z.number().positive(), unit: z.enum(['g', 'ml']) }),
  days: z.number().nonnegative(),
  goalDays: z.number().int().positive(),
  /** „z. B. Nudeln, Reis“ aus den Lebensmittelarten der Warengruppe */
  examples: z.array(z.string()),
})

const day = z.iso.date()

const suggestionSchema = z.object({
  rowKey: z.string(),
  productId: id,
  label: z.string(),
  reason: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('expires'), count: z.number().int().positive(), firstDay: day }),
    z.object({ kind: z.literal('consumed'), lastDay: day }),
  ]),
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
  suggestions: z.array(suggestionSchema),
  own: z.array(itemSchema),
  done: z.array(itemSchema),
  /** Offene, gespeicherte Einträge, wie auf der Übersicht und in der Wochenübersicht */
  openItemCount: z.number().int().nonnegative(),
})

export type RestockListDto = z.infer<typeof restockListSchema>
export type RestockGapDto = z.infer<typeof gapSchema>
export type RestockItemDto = z.infer<typeof itemSchema>
export type RestockSuggestionDto = z.infer<typeof suggestionSchema>
