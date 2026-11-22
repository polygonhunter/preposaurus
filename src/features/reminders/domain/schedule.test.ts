import { describe, expect, it } from 'vitest'
import {
  isInQuietHours,
  isUrgentDue,
  isWeeklySummaryDue,
  isWeeklySummaryPending,
  type WeeklySchedule,
} from './schedule'

const saturdayTen: WeeklySchedule = { isEnabled: true, weekday: 6, time: '10:00:00' }
const at = (iso: string) => new Date(iso)

describe('isWeeklySummaryDue', () => {
  it('ist am Samstag ab 10:00 Uhr Berliner Zeit fällig (Winter)', () => {
    const input = { schedule: saturdayTen, lastSentAt: null }
    expect(isWeeklySummaryDue({ ...input, now: at('2026-11-28T08:59:00Z') })).toBe(false)
    expect(isWeeklySummaryDue({ ...input, now: at('2026-11-28T09:00:00Z') })).toBe(true)
  })

  it('folgt der Sommerzeit', () => {
    const input = { schedule: saturdayTen, lastSentAt: null }
    expect(isWeeklySummaryDue({ ...input, now: at('2026-07-04T07:59:00Z') })).toBe(false)
    expect(isWeeklySummaryDue({ ...input, now: at('2026-07-04T08:00:00Z') })).toBe(true)
  })

  it('holt eine verpasste Übersicht am selben Tag nach, am Folgetag nicht', () => {
    const input = { schedule: saturdayTen, lastSentAt: null }
    expect(isWeeklySummaryDue({ ...input, now: at('2026-11-28T22:30:00Z') })).toBe(true)
    expect(isWeeklySummaryDue({ ...input, now: at('2026-11-28T23:30:00Z') })).toBe(false)
  })

  it('geht nur einmal am Tag hinaus', () => {
    const lastSentAt = at('2026-11-28T09:05:00Z')
    const now = at('2026-11-28T15:00:00Z')
    expect(isWeeklySummaryDue({ schedule: saturdayTen, lastSentAt, now })).toBe(false)
  })

  it('ist eine Woche später wieder fällig', () => {
    const lastSentAt = at('2026-11-28T09:05:00Z')
    const now = at('2026-12-05T09:00:00Z')
    expect(isWeeklySummaryDue({ schedule: saturdayTen, lastSentAt, now })).toBe(true)
  })

  it('schweigt, wenn sie ausgeschaltet ist', () => {
    const schedule = { ...saturdayTen, isEnabled: false }
    expect(
      isWeeklySummaryDue({ schedule, lastSentAt: null, now: at('2026-11-28T10:00:00Z') }),
    ).toBe(false)
  })

  it('schweigt bei einer ungültigen Uhrzeit', () => {
    const schedule = { ...saturdayTen, time: 'zehn' }
    expect(
      isWeeklySummaryDue({ schedule, lastSentAt: null, now: at('2026-11-28T10:00:00Z') }),
    ).toBe(false)
  })
})

describe('isWeeklySummaryPending', () => {
  it('gilt am ganzen Tag der Übersicht, auch vor der Uhrzeit', () => {
    const input = { schedule: saturdayTen, lastSentAt: null }
    expect(isWeeklySummaryPending({ ...input, now: at('2026-11-28T06:00:00Z') })).toBe(true)
    expect(isWeeklySummaryPending({ ...input, now: at('2026-11-27T12:00:00Z') })).toBe(false)
  })
})

describe('isInQuietHours', () => {
  it.each([
    [20 * 60 + 59, false],
    [21 * 60, true],
    [0, true],
    [7 * 60 + 59, true],
    [8 * 60, false],
  ])('Minute %i ist Ruhezeit: %s', (minutes, expected) => {
    expect(isInQuietHours(minutes)).toBe(expected)
  })
})

describe('isUrgentDue', () => {
  it('ist morgens nach der Ruhezeit fällig, nachts nicht', () => {
    const input = { isEnabled: true, lastSentAt: null }
    expect(isUrgentDue({ ...input, now: at('2026-11-24T06:30:00Z') })).toBe(false)
    expect(isUrgentDue({ ...input, now: at('2026-11-24T07:00:00Z') })).toBe(true)
    expect(isUrgentDue({ ...input, now: at('2026-11-24T20:00:00Z') })).toBe(false)
  })

  it('geht höchstens einmal am Berliner Tag hinaus', () => {
    const lastSentAt = at('2026-11-24T07:00:00Z')
    expect(isUrgentDue({ isEnabled: true, lastSentAt, now: at('2026-11-24T15:00:00Z') })).toBe(
      false,
    )
    expect(isUrgentDue({ isEnabled: true, lastSentAt, now: at('2026-11-25T07:00:00Z') })).toBe(true)
  })

  it('schweigt, wenn „Dringend“ ausgeschaltet ist', () => {
    expect(
      isUrgentDue({ isEnabled: false, lastSentAt: null, now: at('2026-11-24T10:00:00Z') }),
    ).toBe(false)
  })
})
