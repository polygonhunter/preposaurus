import { addDays, todayInBerlin, type CalendarDay } from '@/shared/lib/dates'
import type { ContentQuantity } from '@/shared/lib/quantities'

// Abgehakte und ausgeblendete Lücken bis zum Ziel (#201, DATENKATALOG §2.10 und §8 Frage 6). Die
// Lücke selbst bleibt live gerechnet; gespeichert ist nur ein Eintrag „ziel“ mit der Fehlmenge beim
// Abhaken bzw. Ausblenden. Er verdeckt die Lücke, bis sich die Lage ändert:
// - die Lücke wächst um mehr als 10 % über die gespeicherte Menge (mehr Personen, höheres Ziel,
//   etwas verbraucht), oder
// - die Frist ist um: abgehakt 14 Tage (so lange steht der Eintrag unter „Erledigt“), ausgeblendet
//   30 Tage.
// Schrumpft die Lücke (ihr habt erfasst), bleibt sie verdeckt; ist sie geschlossen, gibt es nichts
// mehr zu verdecken. Ausgeblendete Lücken stehen unter „Ausgeblendet“ und lassen sich dort zurückholen.

/** So lange steht ein abgehakter Eintrag unter „Erledigt“ und verdeckt eine abgehakte Lücke. */
export const DONE_VISIBLE_DAYS = 14
/** So lange bleibt eine ausgeblendete Lücke verdeckt, wenn sie nicht wächst. */
export const HIDDEN_GAP_DAYS = 30
/** Wächst die Lücke um mehr als diesen Anteil, kommt sie zurück. */
export const GAP_GROWTH_TOLERANCE = 0.1

export type GoalEntryStatus = 'erledigt' | 'ausgeblendet'

/** Was ein gespeicherter Eintrag zum Verdecken einer Lücke braucht. */
export interface GoalEntryFacts {
  id: string
  source: string
  status: string
  doneAt: Date | null
  groupKey: string | null
  amount: ContentQuantity | null
}

/** Die live gerechnete Lücke einer Warengruppe, soweit hier gebraucht. */
interface GapFacts {
  groupKey: string
  missing: ContentQuantity
}

const DAYS_BY_STATUS: Readonly<Record<GoalEntryStatus, number>> = {
  erledigt: DONE_VISIBLE_DAYS,
  ausgeblendet: HIDDEN_GAP_DAYS,
}

const isGoalStatus = (status: string): status is GoalEntryStatus => status in DAYS_BY_STATUS

/** Liegt der Zeitpunkt höchstens `days` Tage zurück? Gezählt wird der Tag in Berlin. */
export function isWithinDays(doneAt: Date | null, today: CalendarDay, days: number): boolean {
  return doneAt !== null && todayInBerlin(doneAt) >= addDays(today, -days)
}

function hasGrown(gap: GapFacts, saved: ContentQuantity) {
  return (
    gap.missing.unit !== saved.unit || gap.missing.value > saved.value * (1 + GAP_GROWTH_TOLERANCE)
  )
}

/**
 * Verdeckt der gespeicherte Eintrag heute die Lücke?
 * @internal Läuft nur in `splitGaps`, Tests prüfen die Bedingungen direkt.
 */
export function coversGap(entry: GoalEntryFacts, gap: GapFacts, today: CalendarDay): boolean {
  if (entry.source !== 'ziel' || entry.groupKey !== gap.groupKey) return false
  if (entry.amount === null || !isGoalStatus(entry.status)) return false
  return (
    isWithinDays(entry.doneAt, today, DAYS_BY_STATUS[entry.status]) && !hasGrown(gap, entry.amount)
  )
}

/** Eine verdeckte Lücke unter „Ausgeblendet“, mit dem Eintrag zum Zurückholen. */
export type HiddenGap<G extends GapFacts> = G & { entryId: string }

/**
 * Teilt die Lücken in sichtbare und ausgeblendete. Abgehakte verdeckte Lücken stehen in keinem der
 * beiden Teile, ihr Eintrag steht unter „Erledigt“.
 */
export function splitGaps<G extends GapFacts>(
  gaps: readonly G[],
  entries: readonly GoalEntryFacts[],
  today: CalendarDay,
): { visible: G[]; hidden: HiddenGap<G>[] } {
  const coveringEntries = (gap: G) => entries.filter((entry) => coversGap(entry, gap, today))
  const visible = gaps.filter((gap) => coveringEntries(gap).length === 0)
  const hidden = gaps.flatMap((gap) => {
    const entry = coveringEntries(gap).find(({ status }) => status === 'ausgeblendet')
    return entry === undefined ? [] : [{ ...gap, entryId: entry.id }]
  })
  return { visible, hidden }
}
