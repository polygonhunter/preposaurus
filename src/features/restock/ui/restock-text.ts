// Texte der Seite Nachkaufen (#73, UX-Konzept §8.6). Rein, damit es Tests gibt.
import { formatGermanNumber } from '@/shared/lib/quantities'
import type { RestockGapDto, RestockListDto } from '../schemas'

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

/** „6 von 10 Tagen“ am Stichtag des Ziels */
export const gapDaysText = ({ days, goalDays }: RestockGapDto) =>
  `${formatGermanNumber(days)} von ${String(goalDays)} Tagen`

/** Untertitel der Seite: „3 offen“, auch „0 offen“ */
export const openCountText = ({ openCount }: RestockListDto) =>
  `${formatGermanNumber(openCount)} offen`

export const NO_GOAL_TEXT = 'Setzt ein Ziel, dann rechnet die App die Lücken aus.'

/** Leerzustand in einem Satz, null, wenn noch etwas offen ist. */
export function emptyListText(list: RestockListDto): string | null {
  if (list.openCount > 0) return null
  return list.isGoalCalculable ? 'Nichts offen. Euer Ziel ist erreicht.' : NO_GOAL_TEXT
}
