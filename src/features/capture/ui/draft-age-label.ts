// Wie alt ein offener Entwurf ist, in Worten für die Frage „Fortsetzen oder verwerfen?“.
import { dayParts, daysBetween, todayInBerlin } from '@/shared/lib/dates'

const pad = (value: number) => String(value).padStart(2, '0')

/** „von heute“, „von gestern“ oder „vom 21.11.“, jeweils nach Berliner Kalendertag. */
export function draftAgeLabel(updatedAt: Date, now: Date): string {
  const day = todayInBerlin(updatedAt)
  const days = daysBetween(day, todayInBerlin(now))
  if (days <= 0) return 'von heute'
  if (days === 1) return 'von gestern'
  const { day: dayOfMonth, month } = dayParts(day)
  return `vom ${pad(dayOfMonth)}.${pad(month)}.`
}
