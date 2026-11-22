import { describe, expect, it } from 'vitest'
import { addDays, toCalendarDay } from '@/shared/lib/dates'
import {
  canConfirmStillGood,
  DEFAULT_AMPEL_THRESHOLDS,
  unitStateFor,
  validateAmpelThresholds,
} from './unit-state'

const today = toCalendarDay('2026-11-22')
const stateIn = (days: number, thresholds = DEFAULT_AMPEL_THRESHOLDS) =>
  unitStateFor({ bestBefore: addDays(today, days), today, thresholds })

describe('unitStateFor mit den Standardschwellen', () => {
  it.each([
    [-365, 'expired'],
    [-1, 'expired'],
    [0, 'urgent'],
    [1, 'urgent'],
    [28, 'urgent'],
    [29, 'soon'],
    [90, 'soon'],
    [91, 'good'],
    [1000, 'good'],
  ])('%i Tage bis zum MHD ergeben %s', (days, state) => {
    expect(stateIn(days)).toBe(state)
  })

  it('zählt ein MHD von heute noch nicht als abgelaufen', () => {
    expect(unitStateFor({ bestBefore: today, today, thresholds: DEFAULT_AMPEL_THRESHOLDS })).toBe(
      'urgent',
    )
  })
})

describe('unitStateFor mit eigenen Schwellen', () => {
  const thresholds = { soonDays: 30, urgentDays: 7 }

  it.each([
    [7, 'urgent'],
    [8, 'soon'],
    [30, 'soon'],
    [31, 'good'],
  ])('%i Tage ergeben %s', (days, state) => {
    expect(stateIn(days, thresholds)).toBe(state)
  })

  it('kennt keine gelbe Stufe, wenn beide Schwellen gleich sind', () => {
    const equal = { soonDays: 14, urgentDays: 14 }
    expect(stateIn(14, equal)).toBe('urgent')
    expect(stateIn(15, equal)).toBe('good')
  })

  it('kennt keine orange Stufe bei Schwelle 0, außer am Tag des MHD', () => {
    const noUrgent = { soonDays: 30, urgentDays: 0 }
    expect(stateIn(0, noUrgent)).toBe('urgent')
    expect(stateIn(1, noUrgent)).toBe('soon')
  })
})

describe('validateAmpelThresholds', () => {
  it('nimmt gültige Schwellen an', () => {
    expect(validateAmpelThresholds({ soonDays: 90, urgentDays: 28 })).toEqual({
      ok: true,
      value: { soonDays: 90, urgentDays: 28 },
    })
    expect(validateAmpelThresholds({ soonDays: 14, urgentDays: 14 }).ok).toBe(true)
  })

  it('lehnt orange größer als gelb ab', () => {
    expect(validateAmpelThresholds({ soonDays: 28, urgentDays: 29 })).toEqual({
      ok: false,
      error: { kind: 'urgent-above-soon' },
    })
  })

  it.each([
    { soonDays: 90.5, urgentDays: 28 },
    { soonDays: 90, urgentDays: -1 },
    { soonDays: Number.NaN, urgentDays: 28 },
  ])('lehnt %o ab', (thresholds) => {
    expect(validateAmpelThresholds(thresholds)).toEqual({
      ok: false,
      error: { kind: 'not-a-whole-number' },
    })
  })
})

describe('canConfirmStillGood', () => {
  it('bietet „Noch gut“ nur bei abgelaufenem MHD an', () => {
    expect(canConfirmStillGood('expired', 'best-before')).toBe(true)
    expect(canConfirmStillGood('expired', 'use-by')).toBe(false)
    expect(canConfirmStillGood('urgent', 'best-before')).toBe(false)
  })
})
