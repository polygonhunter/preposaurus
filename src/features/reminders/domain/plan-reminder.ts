import { todayInBerlin } from '@/shared/lib/dates'
import type { ReminderKind, ReminderMessage } from './message'
import type { ReminderSettings } from './reminder-settings'
import { isUrgentDue, isWeeklySummaryDue, isWeeklySummaryPending } from './schedule'
import { buildUrgentMessage, selectNewUrgentItems } from './urgent'
import { buildWeeklySummary, type WeeklySummaryInput } from './weekly-summary'

// Entscheidet für einen Haushalt, ob jetzt eine Erinnerung hinausgeht und welche. Erinnerungen
// gelten je Haushalt (EINSTELLUNGEN_NUTZER §1.5): Jedes Gerät mit Push-Abo bekommt dieselbe.
// Am Tag der Wochenübersicht ersetzt sie „Dringend“, denn sie nennt „Diese Woche“ schon. So kommt
// höchstens eine Nachricht am Tag.

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
  const items = selectNewUrgentItems(stock.dueItems, { lastSentAt: lastSent.urgent })
  const message = buildUrgentMessage(items, todayInBerlin(now))
  return message === null ? null : { message, marks: ['urgent'] }
}

export type ReminderTiming = Omit<ReminderInput, 'stock'>

/**
 * Welche Art jetzt an der Reihe ist, noch ohne Blick in den Vorrat. So muss der Worker den Vorrat
 * nur laden, wenn überhaupt etwas hinausgehen darf. null: jetzt nichts.
 */
export function dueReminderKind({ now, settings, lastSent }: ReminderTiming): ReminderKind | null {
  const weekly = { now, schedule: settings.weeklySummary, lastSentAt: lastSent['weekly-summary'] }
  if (isWeeklySummaryPending(weekly)) return isWeeklySummaryDue(weekly) ? 'weekly-summary' : null
  const urgentDue = isUrgentDue({
    now,
    isEnabled: settings.isUrgentEnabled,
    lastSentAt: lastSent.urgent,
  })
  return urgentDue ? 'urgent' : null
}

/** null: jetzt ist nichts zu senden. */
export function planReminder(input: ReminderInput): ReminderPlan | null {
  switch (dueReminderKind(input)) {
    case 'weekly-summary':
      return planWeeklySummary(input)
    case 'urgent':
      return planUrgent(input)
    case null:
      return null
  }
}
