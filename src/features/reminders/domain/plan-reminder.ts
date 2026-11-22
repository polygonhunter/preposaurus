import { todayInBerlin } from '@/shared/lib/dates'
import type { ReminderKind, ReminderMessage } from './message'
import {
  isUrgentDue,
  isWeeklySummaryDue,
  isWeeklySummaryPending,
  type WeeklySchedule,
} from './schedule'
import { buildUrgentMessage, selectNewUrgentItems } from './urgent'
import { buildWeeklySummary, type WeeklySummaryInput } from './weekly-summary'

// Entscheidet für einen Haushalt, ob jetzt eine Erinnerung hinausgeht und welche. Erinnerungen
// gelten je Haushalt (EINSTELLUNGEN_NUTZER §1.5): Jedes Gerät mit Push-Abo bekommt dieselbe.
// Am Tag der Wochenübersicht ersetzt sie „Dringend“, denn sie nennt „Diese Woche“ schon. So kommt
// höchstens eine Nachricht am Tag.

interface ReminderSettings {
  weeklySummary: WeeklySchedule
  isUrgentEnabled: boolean
}

/** Merker „zuletzt gesendet“ je Art (SCHNITTSTELLEN Nr. 27) */
type LastSent = Record<ReminderKind, Date | null>

export interface ReminderInput {
  now: Date
  settings: ReminderSettings
  lastSent: LastSent
  stock: WeeklySummaryInput
}

export interface ReminderPlan {
  message: ReminderMessage
  /** Arten, deren Merker nach dem Versand auf jetzt gesetzt werden */
  marks: ReminderKind[]
}

function planWeeklySummary(input: ReminderInput): ReminderPlan | null {
  const message = buildWeeklySummary(input.stock)
  return message === null ? null : { message, marks: ['weekly-summary', 'urgent'] }
}

function planUrgent({ now, lastSent, stock }: ReminderInput): ReminderPlan | null {
  const lastSentDay = lastSent.urgent === null ? null : todayInBerlin(lastSent.urgent)
  const items = selectNewUrgentItems(stock.dueItems, { lastSentDay })
  const message = buildUrgentMessage(items, todayInBerlin(now))
  return message === null ? null : { message, marks: ['urgent'] }
}

/** null: jetzt ist nichts zu senden. */
export function planReminder(input: ReminderInput): ReminderPlan | null {
  const { now, settings, lastSent } = input
  const weekly = { now, schedule: settings.weeklySummary, lastSentAt: lastSent['weekly-summary'] }
  if (isWeeklySummaryPending(weekly)) {
    return isWeeklySummaryDue(weekly) ? planWeeklySummary(input) : null
  }
  const urgentDue = isUrgentDue({
    now,
    isEnabled: settings.isUrgentEnabled,
    lastSentAt: lastSent.urgent,
  })
  return urgentDue ? planUrgent(input) : null
}
