// Fake des Ports `HouseholdFactsReader` für die Use-Case-Tests der Übersicht (ohne DB). Er
// antwortet nur für den eigenen Haushalt. Alle Werte sind frei gewählte Testdaten.
import type { CalendarDay } from '@/shared/lib/dates'

interface FakeFacts {
  householdId: string
  goal?: { days: number; targetDay: CalendarDay | null } | null
  source?: { name: string; asOf: string; link: string } | null
  openRestockItems?: number
}

export function createFakeHouseholdFacts(data: FakeFacts) {
  const own = (householdId: string) => householdId === data.householdId
  return {
    loadGoal: (householdId: string) =>
      Promise.resolve(own(householdId) ? (data.goal ?? null) : null),
    loadActiveSource: (householdId: string) =>
      Promise.resolve(own(householdId) ? (data.source ?? null) : null),
    countOpenRestockItems: (householdId: string) =>
      Promise.resolve(own(householdId) ? (data.openRestockItems ?? 0) : 0),
  }
}
