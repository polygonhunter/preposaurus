// Texte des Erklär-Blatts (#219, UX-Konzept §8.1 Punkt 5 und §4): Rechnung in Worten und Zahlen,
// was „ca.“ heißt und was nicht mitzählt. Gerechnet ist alles im DTO, hier wird nur formuliert.
import { APPROXIMATE_SHARE_THRESHOLD, isApproximate } from '../domain/approximation'
import { formatGermanNumber } from '@/shared/lib/quantities'
import type { OverviewExplanation, OverviewNeedLine, OverviewSupply } from '../schemas'
import { formatDays } from './head-text'

const ML_PER_LITER = 1000
const PERCENT = 100

const MEMBER_WORDS: Record<OverviewNeedLine['type'], Readonly<{ one: string; many: string }>> = {
  adult: { one: 'Erwachsene:r', many: 'Erwachsene' },
  senior: { one: 'Senior:in', many: 'Senior:innen' },
  teen: { one: 'Jugendliche:r', many: 'Jugendliche' },
  child: { one: 'Kind', many: 'Kinder' },
  baby: { one: 'Baby', many: 'Babys' },
}

const kcalText = (kcal: number) => `${formatGermanNumber(Math.round(kcal), 0)} kcal`
const literText = (ml: number) => `${formatGermanNumber(ml / ML_PER_LITER)} l`

const countText = (count: number, one: string, many: string) =>
  `${formatGermanNumber(count)} ${count === 1 ? one : many}`

/** „2 Erwachsene: je 2.300 kcal und 2,5 l Wasser am Tag“ */
export function needLineText({ type, count, kcalPerDay, waterMlPerDay }: OverviewNeedLine): string {
  const { one, many } = MEMBER_WORDS[type]
  return `${countText(count, one, many)}: je ${kcalText(kcalPerDay)} und ${literText(waterMlPerDay)} Wasser am Tag`
}

/** Zusammen je Tag, dazu der Hinweis auf Babys, die im Bedarf noch nicht zählen. */
export function needTotalText(explanation: OverviewExplanation): string {
  const { kcalPerDay, waterMlPerDay, uncountedMembers } = explanation
  const total = `Zusammen braucht ihr ${kcalText(kcalPerDay)} und ${literText(waterMlPerDay)} Wasser am Tag.`
  if (uncountedMembers === 0) return total
  const babies =
    uncountedMembers === 1 ? '1 Baby zählt' : `${formatGermanNumber(uncountedMembers)} Babys zählen`
  return `${total} ${babies} noch nicht mit, dafür fehlen noch eigene Werte.`
}

/** „31.965 kcal ÷ 6.000 kcal am Tag = 5,3 Tage“ */
export function energyCalculation(supply: OverviewSupply): string {
  const { kcal, kcalPerDay } = supply.explanation
  return `${kcalText(kcal)} ÷ ${kcalText(kcalPerDay)} am Tag = ${formatDays(supply.energyDays)}`
}

/** „18 l ÷ 6 l am Tag = 3 Tage“ */
export function waterCalculation(supply: OverviewSupply): string {
  const { waterMl, waterMlPerDay } = supply.explanation
  return `${literText(waterMl)} ÷ ${literText(waterMlPerDay)} am Tag = ${formatDays(supply.waterDays)}`
}

/** Welcher Wert zählt und warum oben eine ganze Zahl steht. */
export function resultText({ energyDays, waterDays, days }: OverviewSupply): string {
  const rounding = 'Oben steht die Zahl in ganzen Tagen, abgerundet.'
  if (energyDays === waterDays) {
    return `Essen und Wasser reichen gleich lang: ${formatDays(days)}. ${rounding}`
  }
  const limit = energyDays < waterDays ? 'Essen' : 'Wasser'
  return `Es zählt der kleinere Wert, hier ${limit}: ${formatDays(days)}. ${rounding}`
}

const THRESHOLD_PERCENT = Math.round(APPROXIMATE_SHARE_THRESHOLD * PERCENT)

// Unter der Schwelle nie „etwa 10 %“ zeigen, sonst widerspräche der Satz „Hier ist es weniger.“
function percentText(share: number): string {
  const rounded = Math.round(share * PERCENT)
  const percent = isApproximate(share) ? rounded : Math.min(rounded, THRESHOLD_PERCENT - 1)
  return percent === 0 ? 'weniger als 1 %' : `etwa ${String(percent)} %`
}

/** Was „ca.“ heißt, wie groß der Anteil der Richtwerte ist und wie man es los wird. */
export function approximateText({ estimatedShare }: OverviewExplanation): string {
  if (estimatedShare === 0) return 'Alle kcal stammen von den Etiketten. Die Zahl ist genau.'
  const share = `Bei ${percentText(estimatedShare)} der kcal fehlt die Nährwerttabelle, dort rechnet Preposaurus mit einem Richtwert oder einer Schätzung.`
  const rule = `„ca.“ vor der Zahl heißt: Ab ${String(THRESHOLD_PERCENT)} % stammen die kcal spürbar aus Richtwerten oder Schätzungen.`
  if (!isApproximate(estimatedShare)) return `${share} ${rule} Hier ist es weniger.`
  return `${share} ${rule} Tragt die Werte vom Etikett nach, dann wird die Zahl genau.`
}

/** Satzteile für eine oder mehrere Packungen: „1 Packung ist … Sie zählt“ */
function packageWords(count: number) {
  if (count === 1) return { subject: '1 Packung', is: 'ist', has: 'hat', counts: 'zählt' }
  const subject = `${formatGermanNumber(count)} Packungen`
  return { subject, is: 'sind', has: 'haben', counts: 'zählen' }
}

function expiredText(count: number): string {
  const words = packageWords(count)
  return `${words.subject} ${words.is} abgelaufen und ${words.counts} nicht.`
}

function stillGoodText(count: number, stillGoodCounts: boolean): string {
  const words = packageWords(count)
  const checked = `${words.subject} ${words.is} abgelaufen, aber als „Noch gut“ geprüft.`
  return stillGoodCounts
    ? `${checked} Sie ${words.counts} heute mit, weil „Noch gut zählt mit“ eingeschaltet ist.`
    : `${checked} Sie ${words.counts} nicht, weil „Noch gut zählt mit“ ausgeschaltet ist.`
}

function missingDateText(count: number): string {
  const words = packageWords(count)
  return `${words.subject} ${words.has} kein Datum. Sie ${words.counts} heute mit, für das Zieldatum aber nicht.`
}

/** Je Grund ein Satz, was nicht oder nur unter Vorbehalt mitzählt. */
export function caveatTexts({ packages, stillGoodCounts }: OverviewExplanation): string[] {
  const texts = [
    packages.expired > 0 ? expiredText(packages.expired) : null,
    packages.stillGood > 0 ? stillGoodText(packages.stillGood, stillGoodCounts) : null,
    packages.missingDate > 0 ? missingDateText(packages.missingDate) : null,
  ].filter((text) => text !== null)
  return texts.length === 0 ? ['Alle Packungen im Vorrat zählen mit.'] : texts
}
