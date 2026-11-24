import { describe, expect, it } from 'vitest'
import {
  describeDelivery,
  formatMailDelivery,
  formatReminderSummary,
  formatWeeklySchedule,
  WEEKDAY_OPTIONS,
} from './reminder-format'

const saturday = { isEnabled: true, weekday: 6, time: '10:00' }

describe('Texte der Erinnerungen', () => {
  it('nennt sieben Wochentage, Montag zuerst, als ISO-Werte', () => {
    expect(WEEKDAY_OPTIONS[0]).toEqual({ value: '1', label: 'Montag' })
    expect(WEEKDAY_OPTIONS[6]).toEqual({ value: '7', label: 'Sonntag' })
  })

  it('schreibt den Zeitplan aus', () => {
    expect(formatWeeklySchedule(saturday)).toBe('Samstag, 10:00 Uhr')
  })

  it('fasst die Einstellung für die Liste zusammen', () => {
    expect(formatReminderSummary({ weeklySummary: saturday, isUrgentEnabled: true })).toBe(
      'Samstag, 10:00 Uhr',
    )
    const off = { ...saturday, isEnabled: false }
    expect(formatReminderSummary({ weeklySummary: off, isUrgentEnabled: true })).toBe(
      'nur „Dringend“',
    )
    expect(formatReminderSummary({ weeklySummary: off, isUrgentEnabled: false })).toBe('aus')
  })

  it('beschreibt den Mailversand', () => {
    expect(formatMailDelivery({ isMailConfigured: false, addressCount: 0 })).toBe(
      'nicht eingerichtet',
    )
    expect(formatMailDelivery({ isMailConfigured: true, addressCount: 1 })).toBe('1 Adresse')
    expect(formatMailDelivery({ isMailConfigured: true, addressCount: 3 })).toBe('3 Adressen')
    expect(describeDelivery({ isMailConfigured: false, addressCount: 0 })).toContain(
      'kein Mailversand eingerichtet',
    )
    expect(describeDelivery({ isMailConfigured: true, addressCount: 2 })).toContain(
      'unter Mein Konto eine Adresse',
    )
  })
})
