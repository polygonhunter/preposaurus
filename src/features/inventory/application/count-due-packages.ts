// Zähler „Bald fällig 5“ der Seitenleiste (DESIGN_SYSTEM §6, #90): dieselben Packungen wie auf der
// Seite Bald fällig und in „Alle N“ der Übersicht, also alle Zeitgruppen aus `getDueUnits`.
import 'server-only'
import type { CalendarDay } from '@/shared/lib/dates'
import { getDueUnits } from './get-due-units'
import type { StockReader } from './stock-reader'

interface DueCountInput {
  householdId: string
  today: CalendarDay
}

export async function countDuePackages(reader: StockReader, input: DueCountInput): Promise<number> {
  const due = await getDueUnits(reader, { ...input, sort: 'date' })
  return Object.values(due.counts).reduce((sum, count) => sum + count, 0)
}
