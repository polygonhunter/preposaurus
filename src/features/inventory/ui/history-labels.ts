// Texte des Verlaufs (#48), auf der Detailseite und auf der Seite Verlauf: was, wann, von wem und
// welches MHD.
import { dayParts, formatDayWithPrecision, toCalendarDay } from '@/shared/lib/dates'
import type { HistoryEntry } from '../schemas/detail'
import { HISTORY_PAGE_LIMIT, type HistoryFilter, type HistoryItem } from '../schemas/history'
import { formatDate } from './stock-format'

const KIND_LABEL: Record<HistoryEntry['kind'], string> = {
  consumed: 'Verbraucht',
  discarded: 'Entsorgt',
  'still-good': 'Noch gut geprüft',
}

export const PERIOD_LABEL: Record<HistoryFilter['period'], string> = {
  '30-days': '30 Tage',
  '3-months': '3 Monate',
  '12-months': '12 Monate',
  all: 'Alles',
}

export const historyTitle = (entry: Pick<HistoryEntry, 'kind'>) => KIND_LABEL[entry.kind]

const formatDay = (day: string) =>
  formatDayWithPrecision({ date: toCalendarDay(day), precision: 'day' })

const withPerson = (text: string, person: string | null) =>
  person === null ? text : `${text} · ${person}`

/** „23.11.2026 · Alex“; ohne bekannte Person nur der Tag. */
export function historyLine({ day, person }: HistoryEntry): string {
  return withPerson(formatDay(day), person)
}

/** Zeile im Verlauf: „Entsorgt · Alex“; ohne bekannte Person nur, was geschah. */
export const outcomeLine = ({ outcome, person }: HistoryItem) =>
  withPerson(KIND_LABEL[outcome], person)

type WithBestBefore = Pick<HistoryEntry, 'bestBefore'>

/** MHD der Packung wie aufgedruckt, sonst „Datum fehlt“; in der Tabelle ohne „MHD“ davor. */
export function historyBestBefore({ bestBefore }: WithBestBefore, prefix = 'MHD '): string {
  return bestBefore === null ? 'Datum fehlt' : `${prefix}${formatDate(bestBefore)}`
}

const WEEKDAY = new Intl.DateTimeFormat('de-DE', { weekday: 'long', timeZone: 'UTC' })

/** Kopf eines Tages im Verlauf: „Montag, 23.11.2026“. */
export function historyDayLabel(day: string): string {
  const { year, month, day: dayOfMonth } = dayParts(toCalendarDay(day))
  const weekday = WEEKDAY.format(new Date(Date.UTC(year, month - 1, dayOfMonth)))
  return `${weekday}, ${formatDay(day)}`
}

/** Satz unter den Filtern: seit wann der Verlauf reicht. */
export function historyRangeText(from: string | null): string {
  return from === null
    ? 'Alles, was ihr verbraucht oder entsorgt habt.'
    : `Seit ${formatDay(from)}.`
}

/** Satz unter einer gekürzten Seite. Auf den Verlauf einer Art zu verweisen, hilft nur ohne Art. */
export function historyTruncatedText(hasTarget: boolean): string {
  const shown = `Hier stehen die neuesten ${String(HISTORY_PAGE_LIMIT)} Packungen.`
  return hasTarget ? shown : `${shown} Ältere findet ihr im Verlauf der einzelnen Lebensmittelart.`
}
