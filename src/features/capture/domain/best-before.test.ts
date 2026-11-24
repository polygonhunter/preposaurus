import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import {
  detectDateKind,
  parseBestBefore,
  quickPickBestBefore,
  type BestBeforeParseError,
} from './best-before'

const today = toCalendarDay('2026-11-22')

describe('parseBestBefore – gültige Eingaben', () => {
  it.each([
    ['30.09.2027', '2027-09-30', 'day'],
    ['1.9.2027', '2027-09-01', 'day'],
    ['30/09/2027', '2027-09-30', 'day'],
    ['30-09-2027', '2027-09-30', 'day'],
    ['30.09.27', '2027-09-30', 'day'],
    ['01.01.24', '2024-01-01', 'day'],
    ['31.12.41', '2041-12-31', 'day'],
    ['2027-09-30', '2027-09-30', 'day'],
    ['29.02.2028', '2028-02-29', 'day'],
    ['  30.09.2027  ', '2027-09-30', 'day'],
    ['MHD: 30.09.2027', '2027-09-30', 'day'],
    ['Mindestens haltbar bis 30.09.2027', '2027-09-30', 'day'],
    ['mindestens haltbar bis Ende: 09/2027', '2027-09-30', 'month'],
    ['zu verbrauchen bis 03.12.2026', '2026-12-03', 'day'],
    ['Best before: 30.09.2027', '2027-09-30', 'day'],
    ['30.09.2027 14:32', '2027-09-30', 'day'],
    ['30.09.2027 14:32:05 Uhr', '2027-09-30', 'day'],
    ['09/2027', '2027-09-30', 'month'],
    ['9/2027', '2027-09-30', 'month'],
    ['09.2027', '2027-09-30', 'month'],
    ['02/2028', '2028-02-29', 'month'],
    ['02.2027', '2027-02-28', 'month'],
    ['04/2027', '2027-04-30', 'month'],
    ['2027-11', '2027-11-30', 'month'],
    ['Sep 2027', '2027-09-30', 'month'],
    ['SEPT. 2027', '2027-09-30', 'month'],
    ['März 2028', '2028-03-31', 'month'],
    ['Dezember 2027', '2027-12-31', 'month'],
    ['OCT 2027', '2027-10-31', 'month'],
    ['2027', '2027-12-31', 'year'],
    ['MHD 2029', '2029-12-31', 'year'],
  ])('%s ergibt %s (%s)', (text, date, precision) => {
    expect(parseBestBefore(text, today)).toEqual({
      ok: true,
      value: { date, precision, isEstimated: false },
    })
  })
})

describe('parseBestBefore – kein geratenes Datum', () => {
  it.each<[string, BestBeforeParseError['kind']]>([
    ['', 'empty'],
    ['   ', 'empty'],
    ['MHD:', 'empty'],
    ['L 2027 0915', 'no-date'],
    ['L27091', 'no-date'],
    ['Charge 4711', 'no-date'],
    ['LOT: 230915A', 'no-date'],
    ['14:32', 'no-date'],
    ['12:30 Uhr', 'no-date'],
    ['20270930', 'no-date'],
    ['bald', 'no-date'],
    ['Foo 2027', 'no-date'],
    ['30.09', 'incomplete'],
    ['30.09.', 'incomplete'],
    ['9.9', 'incomplete'],
    ['09/27', 'ambiguous'],
    ['30.09.99', 'ambiguous'],
    ['30.09.00', 'ambiguous'],
    ['31.12.23', 'ambiguous'],
    ['01.01.42', 'ambiguous'],
    ['30.09/2027', 'no-date'],
    ['30-09.2027', 'no-date'],
    ['09.12', 'ambiguous'],
    ['31.02.2027', 'invalid-date'],
    ['29.02.2027', 'invalid-date'],
    ['31.04.2027', 'invalid-date'],
    ['00.09.2027', 'invalid-date'],
    ['13/2027', 'invalid-month'],
    ['2027-13', 'invalid-month'],
    ['31.13.2027', 'invalid-month'],
    ['00/2027', 'invalid-month'],
    ['2027-02-30', 'invalid-date'],
    ['1999', 'year-out-of-range'],
    ['4711', 'year-out-of-range'],
    ['30.09.1999', 'year-out-of-range'],
    ['01/2100', 'year-out-of-range'],
  ])('%j ergibt den Fehler %s', (text, kind) => {
    expect(parseBestBefore(text, today)).toEqual({ ok: false, error: { kind } })
  })
})

describe('detectDateKind', () => {
  it.each([
    ['zu verbrauchen bis 03.12.2026', 'use-by'],
    ['Verbrauchen bis 03.12.2026', 'use-by'],
    ['Use by 03/12/2026', 'use-by'],
    ['Mindestens haltbar bis 09/2027', 'best-before'],
    ['MHD 2027', 'best-before'],
    ['30.09.2027', null],
  ])('%s ist %s', (text, kind) => {
    expect(detectDateKind(text)).toBe(kind)
  })
})

describe('quickPickBestBefore', () => {
  it.each([
    ['plus-6-months', '2027-05-31'],
    ['plus-1-year', '2027-11-30'],
    ['plus-2-years', '2028-11-30'],
  ] as const)('%s rechnet ab heute und nimmt das Monatsende (%s)', (pick, date) => {
    expect(quickPickBestBefore(today, pick)).toEqual({
      date,
      precision: 'month',
      isEstimated: true,
    })
  })

  it('landet von Ende August aus im Februar auf dem Monatsende', () => {
    expect(quickPickBestBefore(toCalendarDay('2027-08-31'), 'plus-6-months').date).toBe(
      '2028-02-29',
    )
  })
})
