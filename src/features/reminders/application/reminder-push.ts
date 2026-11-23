// Port für Push-Nachrichten an alle Geräte eines Haushalts (ERI-01). Den Adapter mit web-push und
// VAPID bringt M11-03 (#86). Bis dahin liefert `noPush` nichts aus, dann greift für die
// Wochenübersicht die Mail.
import 'server-only'
import type { ReminderMessage } from '../domain/message'

export interface ReminderPush {
  /** Zahl der Geräte, die die Nachricht angenommen haben. 0: kein gültiges Abo. */
  deliver: (householdId: string, message: ReminderMessage) => Promise<number>
}

export const noPush: ReminderPush = { deliver: () => Promise.resolve(0) }
