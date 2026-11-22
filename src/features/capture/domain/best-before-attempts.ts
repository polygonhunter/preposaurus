// Zweitversuch beim MHD (#114): Meldet die KI Sicherheit „niedrig“ oder kein Datum, folgt ein
// zweiter Versuch mit dem stärkeren Modell. Beide Antworten sind Vorschläge, keine wird ergänzt.
import { parseCalendarDay } from '@/shared/lib/dates'
import type { AiBestBeforeAnswer, AiConfidence } from './ai-answers'

const hasDate = (answer: AiBestBeforeAnswer) =>
  answer.datum !== null && parseCalendarDay(answer.datum.trim()) !== null

export function needsSecondAttempt(answer: AiBestBeforeAnswer): boolean {
  return answer.sicherheit === 'niedrig' || !hasDate(answer)
}

const CONFIDENCE_RANK: Readonly<Record<AiConfidence, number>> = { niedrig: 0, mittel: 1, hoch: 2 }

/**
 * Wählt zwischen erstem und zweitem Versuch. Ein Datum schlägt „kein Datum“, sonst gewinnt die
 * höhere Sicherheit, bei Gleichstand der Zweitversuch (stärkeres Modell). Ist der Zweitversuch
 * gescheitert (`null`), bleibt der erste.
 */
export function pickBestBeforeAnswer(
  first: AiBestBeforeAnswer,
  second: AiBestBeforeAnswer | null,
): AiBestBeforeAnswer {
  if (second === null) return first
  if (hasDate(first) !== hasDate(second)) return hasDate(first) ? first : second
  const isFirstSurer = CONFIDENCE_RANK[first.sicherheit] > CONFIDENCE_RANK[second.sicherheit]
  return isFirstSurer ? first : second
}
