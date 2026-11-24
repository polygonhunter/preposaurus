import type { ReminderDelivery, ReminderSettings } from '../domain/reminder-settings'
import type { WeeklySchedule } from '../domain/schedule'

// Texte der Erinnerungen (#89) für Seite und Liste der Einstellungen. ISO-Wochentage 1 bis 7.

const WEEKDAY_NAMES = [
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
  'Sonntag',
] as const

/** Auswahl im Formular: Wert ist der ISO-Wochentag als Text */
export const WEEKDAY_OPTIONS = WEEKDAY_NAMES.map((label, index) => ({
  value: String(index + 1),
  label,
}))

const weekdayName = (weekday: number) => WEEKDAY_NAMES[weekday - 1] ?? 'unbekannter Tag'

/** „Samstag, 10:00 Uhr“ */
export function formatWeeklySchedule({ weekday, time }: WeeklySchedule): string {
  return `${weekdayName(weekday)}, ${time} Uhr`
}

/** Wert rechts in der Liste der Einstellungen */
export function formatReminderSummary({ weeklySummary, isUrgentEnabled }: ReminderSettings) {
  if (weeklySummary.isEnabled) return formatWeeklySchedule(weeklySummary)
  return isUrgentEnabled ? 'nur „Dringend“' : 'aus'
}

const addressCount = (count: number) => (count === 1 ? '1 Adresse' : `${String(count)} Adressen`)

/** Wert der Zeile „Mail“ unter „Zustellung“ */
export function formatMailDelivery(delivery: ReminderDelivery): string {
  return delivery.isMailConfigured ? addressCount(delivery.addressCount) : 'nicht eingerichtet'
}

/** Erklärung unter „Zustellung“, je nachdem, ob Mails gehen können */
export function describeDelivery(delivery: ReminderDelivery): string {
  const push = 'Push auf euren Geräten kommt in einem späteren Update.'
  if (!delivery.isMailConfigured) {
    return `${push} Auf diesem Server ist noch kein Mailversand eingerichtet, das richtet ein Admin ein.`
  }
  return `${push} Die Wochenübersicht kommt per Mail an alle, die unter Mein Konto eine Adresse eingetragen haben.`
}
