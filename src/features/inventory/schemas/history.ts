// Verlauf als Unterseite des Vorrats (#48, UX-Konzept D7): Filter aus der Adresse und die Ausgabe
// von `getHistory`. Gespiegelt als Typen `HistoryOutcome` und `HistoryPeriod` in domain/history.ts.
import { z } from 'zod'
import { bestBeforeSchema, id, isoDay, stockTargetSchema } from './shared'

const HISTORY_OUTCOMES = ['consumed', 'discarded'] as const
export const HISTORY_PERIODS = ['30-days', '3-months', '12-months', 'all'] as const

/** Höchstens so viele Einträge je Seite; alles Weitere steht im Export (SYS-02). */
export const HISTORY_PAGE_LIMIT = 200

/** Ohne Ausgang zeigt der Verlauf beides, ohne Ziel den ganzen Haushalt. */
export const historyFilterSchema = z.object({
  outcome: z.enum(HISTORY_OUTCOMES).optional(),
  period: z.enum(HISTORY_PERIODS).default('30-days'),
  target: stockTargetSchema.optional(),
})

const historyItemSchema = z.object({
  unitId: id,
  outcome: z.enum(HISTORY_OUTCOMES),
  /** Zeile im Vorrat, auf deren Detailseite der Eintrag führt */
  target: stockTargetSchema,
  /** Bezeichnung des Produkts, wie sie im Vorrat stand */
  name: z.string(),
  person: z.string().nullable(),
  bestBefore: bestBeforeSchema.nullable(),
})

/** @internal Nur Tests prüfen die Ausgabe gegen das Schema, die Seiten nutzen die Typen. */
export const historyPageSchema = z.object({
  /** Gewählte Lebensmittelart bzw. Produkt, null für den ganzen Haushalt */
  target: z.object({ target: stockTargetSchema, name: z.string() }).nullable(),
  /** Erster Tag des Zeitraums, null bei „Alles“ */
  from: isoDay.nullable(),
  /** Packungen im Zeitraum je Ausgang, unabhängig vom gewählten Ausgang */
  counts: z.record(z.enum(HISTORY_OUTCOMES), z.number().int()),
  days: z.array(z.object({ day: isoDay, items: z.array(historyItemSchema) })),
  /** Es gibt mehr Einträge, als die Seite zeigt */
  isTruncated: z.boolean(),
})

export type HistoryFilter = z.infer<typeof historyFilterSchema>
export type HistoryPage = z.infer<typeof historyPageSchema>
export type HistoryItem = z.infer<typeof historyItemSchema>
