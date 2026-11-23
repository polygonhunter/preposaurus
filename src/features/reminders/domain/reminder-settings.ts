import type { WeeklySchedule } from './schedule'

// Erinnerungen des Haushalts (EINSTELLUNGEN_NUTZER §1.5, #89): Wochenübersicht mit Tag und Uhrzeit
// und „Dringend“. Sie gelten für alle im Haushalt, weil beide denselben Vorrat betreffen. Ob ein
// Gerät Push bekommt, entscheidet das Gerät selbst (#86), die Check-in-Mail jeder für sich.

export interface ReminderSettings {
  weeklySummary: WeeklySchedule
  isUrgentEnabled: boolean
}

/** Wie die Wochenübersicht ohne Push ankäme: per Mail an die eingetragenen Adressen */
export interface ReminderDelivery {
  isMailConfigured: boolean
  addressCount: number
}

const HOURS_AND_MINUTES_LENGTH = 'HH:MM'.length

/** „10:00:00“ aus der Spalte `time` als „10:00“, so wie das Uhrzeit-Feld ihn erwartet. */
export function toMinutePrecision(time: string): string {
  return time.slice(0, HOURS_AND_MINUTES_LENGTH)
}
