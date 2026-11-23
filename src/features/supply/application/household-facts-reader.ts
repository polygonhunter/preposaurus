// Port für das, was die Übersicht über den Bestand hinaus vom Haushalt braucht: Zieldatum, aktive
// Quelle mit Stand und offene Einträge der Nachkaufen-Liste (CODE_PRINZIPIEN §8: den Port definiert
// der Verbraucher). Bestand, Mitglieder und Bedarf kommen über den `StockReader` des Vorrats.
import 'server-only'
import type { CalendarDay } from '@/shared/lib/dates'

export interface HouseholdGoal {
  days: number
  targetDay: CalendarDay | null
}

interface ActiveSource {
  name: string
  asOf: string
  link: string
}

export interface HouseholdFactsReader {
  loadGoal: (householdId: string) => Promise<HouseholdGoal | null>
  loadActiveSource: (householdId: string) => Promise<ActiveSource | null>
  countOpenRestockItems: (householdId: string) => Promise<number>
}
