// Port für das, was die Übersicht über den Bestand hinaus vom Haushalt braucht: Zieldatum und aktive
// Quelle mit Stand (CODE_PRINZIPIEN §8: den Port definiert der Verbraucher). Bestand, Mitglieder und
// Bedarf kommen über den `StockReader` des Vorrats, offene Nachkaufen-Einträge von der Liste (#202).
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
  /** false, solange niemand die Werte gegen das Original geprüft hat (M1-09) */
  isVerified: boolean
}

export interface HouseholdFactsReader {
  loadGoal: (householdId: string) => Promise<HouseholdGoal | null>
  loadActiveSource: (householdId: string) => Promise<ActiveSource | null>
}
