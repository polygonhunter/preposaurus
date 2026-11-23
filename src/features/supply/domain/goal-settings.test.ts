import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import { isTargetDateInPast } from './goal-settings'

const today = toCalendarDay('2026-11-23')

describe('Zieldatum', () => {
  it('erkennt ein Datum vor heute, heute selbst gilt noch', () => {
    expect(isTargetDateInPast(toCalendarDay('2026-11-22'), today)).toBe(true)
    expect(isTargetDateInPast(today, today)).toBe(false)
    expect(isTargetDateInPast(toCalendarDay('2027-03-31'), today)).toBe(false)
  })
})
