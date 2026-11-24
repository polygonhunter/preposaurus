// Texte des Erklär-Blatts einer Warengruppe auf der Übersicht (#230, UX-Konzept A9): beide Tage-Zahlen
// mit Namen und Rechnung (#209). „Menge reicht“: Bestand ÷ Zielmenge je Tag. „Satt für“: kcal ÷
// kcal-Tagesbedarf. Gerechnet ist alles im DTO (supply/domain), hier wird nur formuliert.
import { formatQuantity } from '@/shared/lib/quantities'
import { DAYS_TERM, formatDays } from '@/shared/lib/supply-terms'
import type { OverviewGroup } from '../schemas'
import { kcalText } from './explain-text'

/** „7 kg ÷ 1,05 kg am Tag = 6,6 Tage“ */
export function groupCalculation({ unit, stock, targetPerDay, days }: OverviewGroup): string {
  const perDay = formatQuantity({ value: targetPerDay, unit })
  return `${formatQuantity({ value: stock, unit })} ÷ ${perDay} am Tag = ${formatDays(days)}`
}

/** Woher die Zielmenge je Tag kommt. */
export function groupTargetText({ unit, targetPerDay }: OverviewGroup): string {
  const perDay = formatQuantity({ value: targetPerDay, unit })
  return `Die Empfehlung nennt eine Menge je Person und Tag. Für euren Haushalt sind das zusammen ${perDay} am Tag, je Person nach Ernährungsform gerechnet.`
}

/** „Menge reicht 6,6 von 10 Tagen“ in Worten, dazu die Rundung. */
export function groupResultText({ days, goalDays }: OverviewGroup): string {
  const cover = `Euer Bestand deckt die Empfehlung für ${formatDays(days)}, euer Ziel sind ${formatDays(goalDays)}.`
  return `${cover} Die Tage sind auf eine Nachkommastelle abgerundet.`
}

/** „23.450 kcal ÷ 6.000 kcal am Tag = 3,9 Tage“, ohne Bedarf null. */
export function satietyCalculation({ satiety }: OverviewGroup): string | null {
  if (satiety === null) return null
  const { kcal, isApproximate, kcalPerDay, days } = satiety
  return `${kcalText(kcal, isApproximate)} ÷ ${kcalText(kcalPerDay)} am Tag = ${formatDays(days)}`
}

/** Was „Satt für“ hier ergibt, ohne Bedarf warum es fehlt. */
export function satietyResultText({ satiety }: OverviewGroup): string {
  if (satiety === null) {
    return `„${DAYS_TERM.food}“ zeigt Preposaurus, sobald Mitglieder eingetragen sind.`
  }
  return `So lange machen die kcal dieser Warengruppe allein euren ganzen Haushalt satt: ${formatDays(satiety.days)}, abgerundet.`
}

/** Was die beiden Zahlen messen und warum sie verschieden sind (#209). */
export const GROUP_MEANING_TEXTS = [
  `„${DAYS_TERM.amount}“ vergleicht die Menge mit der Empfehlung für diese Warengruppe. Die Zahl zeigt, wie ausgewogen euer Vorrat ist.`,
  `„${DAYS_TERM.food}“ rechnet mit den kcal. Wie lange das Essen insgesamt reicht, zeigt oben der Balken Essen.`,
  'Beide Zahlen stimmen, sie messen nur Verschiedenes. Im Vorrat stehen sie im Kopf der Warengruppe nebeneinander.',
] as const

/** Welche Packungen zählen, gleich wie bei Essen und Wasser. */
export const GROUP_COUNTING_TEXT =
  'Es zählen dieselben Packungen wie bei Essen und Wasser oben: Abgelaufenes zählt nicht.'
