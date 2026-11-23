// Texte des Verlaufs auf der Detailseite (#48): was, wann, von wem und welches MHD.
import { formatDayWithPrecision, toCalendarDay } from '@/shared/lib/dates'
import type { HistoryEntry } from '../schemas/detail'
import { formatDate } from './stock-format'

const KIND_LABEL: Record<HistoryEntry['kind'], string> = {
  consumed: 'Verbraucht',
  discarded: 'Entsorgt',
  'still-good': 'Noch gut geprüft',
}

export const historyTitle = (entry: HistoryEntry) => KIND_LABEL[entry.kind]

/** „23.11.2026 · Alex“; ohne bekannte Person nur der Tag. */
export function historyLine({ day, person }: HistoryEntry): string {
  const date = formatDayWithPrecision({ date: toCalendarDay(day), precision: 'day' })
  return person === null ? date : `${date} · ${person}`
}

/** MHD der Packung wie aufgedruckt, sonst „Datum fehlt“. */
export function historyBestBefore({ bestBefore }: HistoryEntry): string {
  return bestBefore === null ? 'Datum fehlt' : `MHD ${formatDate(bestBefore)}`
}
