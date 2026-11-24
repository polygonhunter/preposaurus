// Texte der Seite Nachkaufen (#73, #200, #201, #202, UX-Konzept §8.6). Rein, damit es Tests gibt.
import { formatDayWithPrecision, toCalendarDay } from '@/shared/lib/dates'
import { formatGermanNumber } from '@/shared/lib/quantities'
import { amountDays, namedDaysText } from '@/shared/lib/supply-terms'
import { DONE_VISIBLE_DAYS, GAP_GROWTH_TOLERANCE, HIDDEN_GAP_DAYS } from '../domain/goal-entries'
import type { RestockGapDto, RestockListDto, RestockSuggestionDto } from '../schemas'

const GRAMS_PER_KG = 1000
const ML_PER_LITRE = 1000
/** Unter einem Kilo auf 10 g aufgerundet, darüber auf 100 g */
const SMALL_GRAM_STEP = 10
const KG_STEPS = 10

/** Fehlmenge in kg bzw. l, immer aufgerundet: lieber eine Flasche mehr als eine zu wenig. */
export function formatGapAmount({ value, unit }: RestockGapDto['missing']): string {
  if (unit === 'ml') return `${formatGermanNumber(Math.ceil(value / ML_PER_LITRE))} l`
  if (value < GRAMS_PER_KG) {
    return `${formatGermanNumber(Math.ceil(value / SMALL_GRAM_STEP) * SMALL_GRAM_STEP)} g`
  }
  return `${formatGermanNumber(Math.ceil((value / GRAMS_PER_KG) * KG_STEPS) / KG_STEPS)} kg`
}

/** „Menge reicht 6 von 10 Tagen“ am Stichtag des Ziels, derselbe Name wie im Vorrat (#209) */
const gapDaysText = ({ days, goalDays }: RestockGapDto) => namedDaysText(amountDays(days, goalDays))

/** Zweitzeile einer Lücke: „Menge reicht 6 von 10 Tagen · z. B. Nudeln, Reis“ */
export function gapSubtitle(gap: RestockGapDto): string {
  const days = gapDaysText(gap)
  return gap.examples.length === 0 ? days : `${days} · z. B. ${gap.examples.join(', ')}`
}

/** Warum ein Vorschlag unter „Ersetzen“ steht (A14). */
export function suggestionReasonText({ reason }: RestockSuggestionDto): string {
  if (reason.kind === 'consumed') {
    const day = formatDayWithPrecision({ date: toCalendarDay(reason.lastDay), precision: 'day' })
    return `Am ${day} aufgebraucht`
  }
  return reason.count === 1
    ? 'Läuft vor dem Ziel ab'
    : `${String(reason.count)} Packungen laufen vor dem Ziel ab`
}

const countWithNoun = (count: number, one: string, many: string) =>
  `${formatGermanNumber(count)} ${count === 1 ? one : many}`

/**
 * Untertitel der Seite, z. B. „3 Einträge offen · 2 Vorschläge · 1 Warengruppe unter dem Ziel“.
 * Die Einträge stehen immer da (auch „0 Einträge offen“) und sind dieselbe Zahl wie auf der
 * Übersicht und in der Wochenübersicht; Vorschläge und Lücken werden eigens genannt (#202). Unter
 * dem Ziel zählen auch abgehakte und ausgeblendete Lücken, wie auf der Übersicht (#201).
 */
export function openCountText({
  openItemCount,
  suggestions,
  belowGoalCount,
}: RestockListDto): string {
  return [
    `${countWithNoun(openItemCount, 'Eintrag', 'Einträge')} offen`,
    suggestions.length > 0 ? countWithNoun(suggestions.length, 'Vorschlag', 'Vorschläge') : null,
    belowGoalCount > 0
      ? `${countWithNoun(belowGoalCount, 'Warengruppe', 'Warengruppen')} unter dem Ziel`
      : null,
  ]
    .filter((part) => part !== null)
    .join(' · ')
}

const hasAnythingOpen = ({ openItemCount, suggestions, gaps }: RestockListDto) =>
  openItemCount + suggestions.length + gaps.length > 0

export const NO_GOAL_TEXT = 'Setzt ein Ziel, dann rechnet die App die Lücken aus.'

/** Leerzustand in einem Satz, null, wenn noch etwas offen ist. */
export function emptyListText(list: RestockListDto): string | null {
  if (hasAnythingOpen(list)) return null
  if (!list.isGoalCalculable) return NO_GOAL_TEXT
  return list.belowGoalCount === 0
    ? 'Nichts offen. Euer Ziel ist erreicht.'
    : 'Nichts offen. Was ihr abgehakt oder ausgeblendet habt, steht weiter unten.'
}

const percent = (share: number) => `${String(Math.round(share * 100))} %`

/** Satz unter „Ausgeblendet“: wann eine Lücke von selbst zurückkommt (#201). */
export const HIDDEN_GAP_RULE_TEXT = `Eine ausgeblendete Lücke kommt von selbst zurück, wenn sie um mehr als ${percent(GAP_GROWTH_TOLERANCE)} wächst, spätestens nach ${String(HIDDEN_GAP_DAYS)} Tagen. Abgehakte Lücken stehen ${String(DONE_VISIBLE_DAYS)} Tage unter „Erledigt“.`
