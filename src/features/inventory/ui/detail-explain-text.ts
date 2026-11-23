// Texte des Erklär-Blatts zu den Kennwerten im Detail (#230, UX-Konzept §3 und §4): woraus Packungen,
// Menge, kcal und Tage entstehen. Gerechnet ist alles im DTO (supply/domain/node-totals), hier wird
// nur formuliert. Die Tage hier sind der Beitrag in kcal, nicht die Abdeckung der Warengruppe
// („X von 10 Tagen“); das Blatt sagt das ausdrücklich (#209).
import {
  APPROXIMATE_THRESHOLD_PERCENT,
  estimatedSharePercentText,
} from '@/shared/lib/approximation'
import { formatGermanNumber, formatQuantity } from '@/shared/lib/quantities'
import type { FoodTypeDetail, NodeTotalsDto } from '../schemas'
import { formatAmounts, formatDays, formatKcal, formatPackages, supplyDaysOf } from './stock-format'

type Need = FoodTypeDetail['need']

/** Zählt diese Lebensmittelart in Wasser-Tagen statt in Essen-Tagen? Wie supplyDaysOf. */
const isWater = (totals: NodeTotalsDto) => totals.amounts.ml > 0 && totals.kcal === 0

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
  if (isWater(totals)) return 'Wasser hat keine kcal. Es zählt in Litern, als Wasser.'
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
  if (isWater(totals)) {
    const water = formatQuantity({ value: totals.waterMl, unit: 'ml' })
    const perDay = formatQuantity({ value: need.waterMlPerDay, unit: 'ml' })
    return `${water} ÷ ${perDay} am Tag = ${formatDays(days)}`
  }
  const kcal = `${formatGermanNumber(Math.round(totals.kcal), 0)} kcal`
  const perDay = `${formatGermanNumber(Math.round(need.kcalPerDay), 0)} kcal`
  return `${kcal} ÷ ${perDay} am Tag = ${formatDays(days)}`
}

/** Was die Tage bedeuten: Beitrag für den ganzen Haushalt, nicht die Abdeckung (#209). */
export function daysMeaningTexts(totals: NodeTotalsDto): string[] {
  if (supplyDaysOf(totals) === null) {
    return ['Tage zeigt Preposaurus erst, wenn Mitglieder und eine Empfehlung eingetragen sind.']
  }
  if (isWater(totals)) {
    return ['So lange reicht dieses Wasser allein für euren ganzen Haushalt.']
  }
  return [
    'So lange reichen die kcal dieser Lebensmittelart allein für euren ganzen Haushalt.',
    'An der Warengruppe steht auf der Übersicht eine andere Zahl („X von 10 Tagen“): Sie vergleicht die Menge mit der Empfehlung für die ganze Warengruppe, nicht die kcal.',
  ]
}

/** Die übliche Haltbarkeit ist nur ein Hinweis, nie ein MHD (#110). */
export const SHELF_LIFE_EXPLAIN_TEXT =
  'Die übliche Haltbarkeit ist ein Richtwert der Lebensmittelart. Preposaurus speichert ihn nie als MHD, es zählt das Datum auf der Packung.'
