// Port der Erinnerungen (CODE_PRINZIPIEN §8: den Port definiert der Verbraucher). Umgesetzt von
// `createReminderRepository` in reminders/data, in Tests von einem Fake.
import 'server-only'
import type { CHECK_IN_CADENCES } from '@/shared/config/constants'
import type { ReminderKind } from '../domain/message'
import type { ReminderTiming } from '../domain/plan-reminder'

export type CheckInCadence = (typeof CHECK_IN_CADENCES)[number]

/** Zeitplan und Merker eines Haushalts, alles außer dem Zeitpunkt jetzt. */
export interface HouseholdReminderState extends Omit<ReminderTiming, 'now'> {
  householdId: string
}

/** Ein aktiver Nutzer, der die Check-in-Mail in diesem Rhythmus haben will. */
export interface CheckInRecipient {
  householdId: string
  address: string
}

export interface ReminderRepository {
  listHouseholds: () => Promise<HouseholdReminderState[]>
  /** Erfassungszeitpunkt je Packung, nur Packungen dieses Haushalts */
  loadAddedTimes: (householdId: string, unitIds: readonly string[]) => Promise<Map<string, Date>>
  /** Packungen im Vorrat ohne Datum (#116) */
  countMissingDates: (householdId: string) => Promise<number>
  /** Gespeicherte Adressen der aktiven Nutzer, auch technische (die Mail überspringt sie) */
  listAddresses: (householdId: string) => Promise<string[]>
  listCheckInRecipients: (cadence: CheckInCadence) => Promise<CheckInRecipient[]>
  markSent: (householdId: string, kinds: readonly ReminderKind[], at: Date) => Promise<void>
}
