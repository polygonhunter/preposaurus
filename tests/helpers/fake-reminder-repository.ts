// Fake des Ports `ReminderRepository` (reminders/application) für die Use-Case-Tests ohne DB.
// Merkt sich gesetzte Merker. Alle Adressen sind Beispieladressen.
import type { ReminderKind } from '../../src/features/reminders/domain/message'
import type { ReminderTiming } from '../../src/features/reminders/domain/plan-reminder'

interface FakeHousehold extends Omit<ReminderTiming, 'now'> {
  householdId: string
  addresses?: string[]
  /** Erfassungszeitpunkt je Packungs-ID */
  addedTimes?: Record<string, Date>
  missingDateCount?: number
}

interface FakeCheckIn {
  householdId: string
  address: string
  cadence: string
}

interface MarkCall {
  householdId: string
  kinds: readonly ReminderKind[]
  at: Date
}

export const DEFAULT_TIMING: Omit<ReminderTiming, 'now'> = {
  settings: {
    weeklySummary: { isEnabled: true, weekday: 6, time: '10:00:00' },
    isUrgentEnabled: true,
  },
  lastSent: { 'weekly-summary': null, urgent: null },
}

export function createFakeReminderRepository(
  households: readonly FakeHousehold[],
  checkIns: readonly FakeCheckIn[] = [],
) {
  const marks: MarkCall[] = []
  const find = (householdId: string) => households.find((h) => h.householdId === householdId)
  return {
    marks,
    listHouseholds: () =>
      Promise.resolve(
        households.map(({ householdId, settings, lastSent }) => ({
          householdId,
          settings,
          lastSent,
        })),
      ),
    loadAddedTimes: (householdId: string, unitIds: readonly string[]) => {
      const times = find(householdId)?.addedTimes ?? {}
      const known = unitIds.flatMap((id) => (times[id] ? [[id, times[id]] as const] : []))
      return Promise.resolve(new Map<string, Date>(known))
    },
    countMissingDates: (householdId: string) =>
      Promise.resolve(find(householdId)?.missingDateCount ?? 0),
    listAddresses: (householdId: string) => Promise.resolve(find(householdId)?.addresses ?? []),
    listCheckInRecipients: (cadence: string) =>
      Promise.resolve(
        checkIns
          .filter((entry) => entry.cadence === cadence)
          .map(({ householdId, address }) => ({ householdId, address })),
      ),
    markSent: (householdId: string, kinds: readonly ReminderKind[], at: Date) => {
      marks.push({ householdId, kinds, at })
      return Promise.resolve()
    },
  }
}
