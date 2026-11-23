import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import { formatGoalSummary } from './goal-format'

describe('formatGoalSummary', () => {
  it('nennt Dauer und Zieldatum', () => {
    expect(formatGoalSummary({ days: 10, targetDate: toCalendarDay('2027-03-01') })).toBe(
      '10 Tage bis 01.03.2027',
    )
  })

  it('nennt ohne Zieldatum nur die Dauer', () => {
    expect(formatGoalSummary({ days: 1, targetDate: null })).toBe('1 Tag')
  })
})
