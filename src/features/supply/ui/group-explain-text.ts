// Texte des Erklär-Blatts einer Warengruppe auf der Übersicht (#230, UX-Konzept A9): Bestand ÷
// Zielmenge je Tag = „X von Y Tagen“. Gerechnet ist alles im DTO (supply/domain/group-progress),
// hier wird nur formuliert. Weil der Vorrat an derselben Warengruppe den Beitrag in kcal zeigt
// (#209), sagt das Blatt ausdrücklich, was diese Zahl misst und was nicht.
import { formatQuantity } from '@/shared/lib/quantities'
import type { OverviewGroup } from '../schemas'
import { formatDays } from './head-text'

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

/** „6,6 von 10 Tagen“ in Worten, dazu die Rundung. */
export function groupResultText({ days, goalDays }: OverviewGroup): string {
  const cover = `Euer Bestand deckt die Empfehlung für ${formatDays(days)}, euer Ziel sind ${formatDays(goalDays)}.`
  return `${cover} Die Tage sind auf eine Nachkommastelle abgerundet.`
}

/** Was die Zahl misst: Menge gegen Empfehlung, nicht die kcal (#209). */
export const GROUP_MEANING_TEXTS = [
  'Diese Zahl vergleicht die Menge mit der Empfehlung für diese Warengruppe. Sie zeigt, wie ausgewogen euer Vorrat ist, nicht wie lange das Essen reicht. Das zeigt oben der Balken Essen, gerechnet in kcal.',
  'Im Vorrat steht bei der Warengruppe ein anderer Wert: ihr Beitrag zum Essen. Das sind die Tage, die ihre kcal allein für euren ganzen Haushalt reichen. Deshalb können dort andere Tage stehen.',
] as const

/** Welche Packungen zählen, gleich wie bei Essen und Wasser. */
export const GROUP_COUNTING_TEXT =
  'Es zählen dieselben Packungen wie bei Essen und Wasser oben: Abgelaufenes zählt nicht.'
