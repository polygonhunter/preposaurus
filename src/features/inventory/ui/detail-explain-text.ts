// Texte des Erklär-Blatts zu den Kennwerten im Detail (#230, UX-Konzept §3 und §4): woraus Packungen,
// Menge, kcal und Tage entstehen. Gerechnet ist alles im DTO (supply/domain/node-totals), hier wird
// nur formuliert. Die Tage hier sind „Satt für“ (kcal) bzw. „Wasser für“ (Liter), nicht „Menge
// reicht“ der Warengruppe; das Blatt sagt das ausdrücklich (#209).
import {
  APPROXIMATE_THRESHOLD_PERCENT,
  estimatedSharePercentText,
} from '@/shared/lib/approximation'
import { formatQuantity } from '@/shared/lib/quantities'
import { DAYS_TERM, formatDays } from '@/shared/lib/supply-terms'
import type { FoodTypeDetail } from '../schemas/detail'
import type { NodeTotalsDto } from '../schemas/shared'
import {
  countsAsWater,
  formatAmounts,
  formatKcal,
  formatPackages,
  supplyDaysOf,
} from './stock-format'

type Need = FoodTypeDetail['need']

/**
 * Ein Getränk mit 0 kcal außerhalb der Warengruppe Wasser (z. B. ungesüßter Tee, #260). Fehlende
 * kcal zählen ebenfalls mit 0, deshalb sagt der Text „zählt mit 0 kcal“ statt „hat keine kcal“.
 */
const isCalorieFreeDrink = (totals: NodeTotalsDto) =>
  !countsAsWater(totals) && totals.amounts.ml > 0 && totals.kcal === 0

/** „8 Packungen mit zusammen 4 kg zählen heute mit.“ */
export function countedText(totals: NodeTotalsDto): string {
  if (totals.packages === 0) return 'Heute zählt keine Packung mit.'
  const verb = totals.packages === 1 ? 'zählt' : 'zählen'
  const amounts = formatAmounts(totals.amounts)
  const subject = formatPackages(totals.packages)
  return amounts === null
    ? `${subject} ${verb} heute mit.`
    : `${subject} mit zusammen ${amounts} ${verb} heute mit.`
}

/** Was nicht oder nur heute zählt: abgelaufen, „Datum fehlt“. */
export function notCountedTexts({ uncountedPackages, withoutDate }: NodeTotalsDto): string[] {
  const texts = [
    uncountedPackages > 0
      ? `${formatPackages(uncountedPackages)} im Vorrat ${uncountedPackages === 1 ? 'zählt' : 'zählen'} heute nicht, weil ihr Datum vorbei ist.`
      : null,
    withoutDate > 0
      ? `${formatPackages(withoutDate)} ohne Datum ${withoutDate === 1 ? 'zählt' : 'zählen'} heute mit, für das Zieldatum aber nicht.`
      : null,
  ].filter((text) => text !== null)
  return texts.length === 0 ? ['Alle Packungen im Vorrat zählen mit.'] : texts
}

/** Wie die kcal entstehen, bei Wasser der Hinweis, dass es in Litern zählt. */
export function kcalText(totals: NodeTotalsDto): string {
  if (countsAsWater(totals) && totals.kcal === 0) {
    return 'Wasser hat keine kcal. Es zählt in Litern, als Wasser.'
  }
  if (isCalorieFreeDrink(totals)) return 'Dieses Getränk zählt mit 0 kcal.'
  const total = formatKcal(totals.kcal, totals.isApproximate)
  return `Je Packung: Inhalt × kcal je 100 g bzw. ml ÷ 100. Zusammen ${total}.`
}

/** Woher die kcal stammen und was „ca.“ heißt. */
export function kcalOriginText({ kcal, estimatedKcalShare }: NodeTotalsDto): string | null {
  if (kcal === 0) return null
  if (estimatedKcalShare === 0) return 'Alle kcal stammen von den Etiketten.'
  const share = `Bei ${estimatedSharePercentText(estimatedKcalShare)} der kcal fehlt die Nährwerttabelle, dort zählt der Richtwert der Lebensmittelart oder eine Schätzung.`
  return `${share} „ca.“ steht ab ${String(APPROXIMATE_THRESHOLD_PERCENT)} %.`
}

/** „14.320 kcal ÷ 6.000 kcal am Tag = 2,3 Tage“, bei Wasser in Litern. Ohne Bedarf null. */
export function daysCalculation(totals: NodeTotalsDto, need: Need): string | null {
  const days = supplyDaysOf(totals)
  if (days === null) return null
  if (countsAsWater(totals)) {
    const water = formatQuantity({ value: totals.waterMl, unit: 'ml' })
    const perDay = formatQuantity({ value: need.waterMlPerDay, unit: 'ml' })
    return `${water} ÷ ${perDay} am Tag = ${formatDays(days)}`
  }
  const kcal = formatKcal(totals.kcal, totals.isApproximate)
  const perDay = formatKcal(need.kcalPerDay, false)
  return `${kcal} ÷ ${perDay} am Tag = ${formatDays(days)}`
}

/** Überschrift des Abschnitts, derselbe Name wie die Kachel: „Satt für“ bzw. „Wasser für“ (#209). */
export const daysTitle = (totals: NodeTotalsDto) =>
  countsAsWater(totals) ? DAYS_TERM.water : DAYS_TERM.food

const AMOUNT_HINT = `„${DAYS_TERM.amount} … von … Tagen“`

/** Was die Tage bedeuten: Beitrag für den ganzen Haushalt, nicht „Menge reicht“ (#209). */
export function daysMeaningTexts(totals: NodeTotalsDto): string[] {
  if (supplyDaysOf(totals) === null) {
    return ['Tage zeigt Preposaurus erst, wenn Mitglieder und eine Empfehlung eingetragen sind.']
  }
  if (countsAsWater(totals)) {
    return [
      `„${DAYS_TERM.water}“: So lange reicht dieses Wasser allein für euren ganzen Haushalt, gerechnet mit eurem Wasserbedarf je Person. Wasser hat keine kcal, deshalb steht hier nicht „${DAYS_TERM.food}“.`,
      `An der Warengruppe Wasser steht außerdem ${AMOUNT_HINT}: Diese Zahl vergleicht die Liter mit der Zielmenge der Empfehlung. Weil der Bedarf je Person verschieden sein kann, liegen beide Zahlen manchmal etwas auseinander.`,
    ]
  }
  if (isCalorieFreeDrink(totals)) {
    return [
      `Ohne kcal trägt dieses Getränk nichts zu „${DAYS_TERM.food}“ bei.`,
      `In „${DAYS_TERM.water}“ zählt nur die Warengruppe Wasser. Andere Getränke stehen daneben, damit der Wasservorrat nicht größer wirkt, als er ist.`,
    ]
  }
  return [
    `„${DAYS_TERM.food}“: So lange machen die kcal dieser Lebensmittelart allein euren ganzen Haushalt satt.`,
    `An der Warengruppe steht außerdem ${AMOUNT_HINT}: Diese Zahl vergleicht die Menge der ganzen Warengruppe mit der Empfehlung, nicht die kcal. Für eine einzelne Lebensmittelart gibt es keine Mengenempfehlung.`,
  ]
}

/** Die übliche Haltbarkeit ist nur ein Hinweis, nie ein MHD (#110). */
export const SHELF_LIFE_EXPLAIN_TEXT =
  'Die übliche Haltbarkeit ist ein Richtwert der Lebensmittelart. Preposaurus speichert ihn nie als MHD, es zählt das Datum auf der Packung.'
