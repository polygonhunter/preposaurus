import { describe, expect, it } from 'vitest'
import {
  addDays,
  addMonths,
  calendarDayFrom,
  dayParts,
  daysBetween,
  daysInMonth,
  endOfMonth,
  endOfYear,
  parseCalendarDay,
  toCalendarDay,
  todayInBerlin,
} from './dates'

const day = toCalendarDay

describe('parseCalendarDay', () => {
  it.each(['2027-09-30', '2028-02-29', '2026-01-01', '2026-12-31'])('liest %s', (text) => {
    expect(parseCalendarDay(text)).toBe(text)
  })

  it.each([
    ['2027-02-29', 'kein Schaltjahr'],
    ['2100-02-29', 'Jahrhundert ohne Schaltjahr'],
    ['2027-04-31', 'April hat 30 Tage'],
    ['2027-13-01', 'Monat 13'],
    ['2027-00-10', 'Monat 0'],
    ['2027-01-00', 'Tag 0'],
    ['2027-9-30', 'einstelliger Monat'],
    ['30.09.2027', 'deutsches Format'],
    ['2027-09-30T12:00', 'mit Uhrzeit'],
    ['', 'leer'],
    ['0000-01-01', 'Jahr 0'],
  ])('lehnt %s ab (%s)', (text) => {
    expect(parseCalendarDay(text)).toBeNull()
  })
})

describe('calendarDayFrom', () => {
  it('baut einen Tag aus Teilen', () => {
    expect(calendarDayFrom({ year: 2027, month: 9, day: 5 })).toBe('2027-09-05')
  })

  it('lehnt Kommazahlen und ungültige Tage ab', () => {
    expect(calendarDayFrom({ year: 2027, month: 1.5, day: 1 })).toBeNull()
    expect(calendarDayFrom({ year: 2027, month: 2, day: 29 })).toBeNull()
  })
})

describe('toCalendarDay', () => {
  it('wirft bei einem ungültigen festen Wert', () => {
    expect(() => toCalendarDay('2027-02-30')).toThrow(RangeError)
  })
})

describe('dayParts und daysInMonth', () => {
  it('zerlegt einen Tag in Zahlen', () => {
    expect(dayParts(day('2028-02-29'))).toEqual({ year: 2028, month: 2, day: 29 })
  })

  it('kennt Schaltjahre', () => {
    expect(daysInMonth(2028, 2)).toBe(29)
    expect(daysInMonth(2027, 2)).toBe(28)
    expect(daysInMonth(2000, 2)).toBe(29)
    expect(daysInMonth(2100, 2)).toBe(28)
  })
})

describe('todayInBerlin', () => {
  it('liefert kurz vor Mitternacht UTC im Winter schon den nächsten Tag', () => {
    expect(todayInBerlin(new Date('2026-12-31T23:30:00Z'))).toBe('2027-01-01')
  })

  it('liefert kurz vor Mitternacht UTC im Sommer schon den nächsten Tag', () => {
    expect(todayInBerlin(new Date('2027-06-30T22:30:00Z'))).toBe('2027-07-01')
  })

  it('bleibt knapp vor Mitternacht Berlin beim alten Tag', () => {
    expect(todayInBerlin(new Date('2027-06-30T21:59:59Z'))).toBe('2027-06-30')
    expect(todayInBerlin(new Date('2026-11-22T22:59:59Z'))).toBe('2026-11-22')
  })

  it('stimmt an den Tagen der Zeitumstellung', () => {
    expect(todayInBerlin(new Date('2027-03-28T00:30:00Z'))).toBe('2027-03-28')
    expect(todayInBerlin(new Date('2027-10-31T23:30:00Z'))).toBe('2027-11-01')
  })
})

describe('daysBetween', () => {
  it('zählt ganze Tage vorwärts und rückwärts', () => {
    expect(daysBetween(day('2026-11-22'), day('2026-11-23'))).toBe(1)
    expect(daysBetween(day('2026-11-23'), day('2026-11-22'))).toBe(-1)
    expect(daysBetween(day('2026-11-22'), day('2026-11-22'))).toBe(0)
  })

  it('zählt über den Schalttag', () => {
    expect(daysBetween(day('2028-02-28'), day('2028-03-01'))).toBe(2)
    expect(daysBetween(day('2027-02-28'), day('2027-03-01'))).toBe(1)
  })

  it('verliert beim Sommerzeitwechsel keinen Tag', () => {
    expect(daysBetween(day('2027-03-27'), day('2027-03-29'))).toBe(2)
    expect(daysBetween(day('2027-10-30'), day('2027-11-01'))).toBe(2)
  })

  it('zählt ein ganzes Jahr', () => {
    expect(daysBetween(day('2027-01-01'), day('2028-01-01'))).toBe(365)
    expect(daysBetween(day('2028-01-01'), day('2029-01-01'))).toBe(366)
  })
})

describe('addDays', () => {
  it('springt über Monats- und Jahresgrenzen', () => {
    expect(addDays(day('2026-12-31'), 1)).toBe('2027-01-01')
    expect(addDays(day('2028-02-28'), 1)).toBe('2028-02-29')
    expect(addDays(day('2027-03-01'), -1)).toBe('2027-02-28')
  })
})

describe('addMonths', () => {
  it('nimmt das Monatsende, wenn es den Tag nicht gibt (31. → 30.)', () => {
    expect(addMonths(day('2027-03-31'), 1)).toBe('2027-04-30')
    expect(addMonths(day('2027-08-31'), 1)).toBe('2027-09-30')
  })

  it('landet im Februar auf dem 28. oder im Schaltjahr auf dem 29.', () => {
    expect(addMonths(day('2027-01-31'), 1)).toBe('2027-02-28')
    expect(addMonths(day('2028-01-31'), 1)).toBe('2028-02-29')
    expect(addMonths(day('2028-02-29'), 12)).toBe('2029-02-28')
  })

  it('wechselt das Jahr in beide Richtungen', () => {
    expect(addMonths(day('2026-11-22'), 6)).toBe('2027-05-22')
    expect(addMonths(day('2026-11-22'), 24)).toBe('2028-11-22')
    expect(addMonths(day('2027-01-15'), -1)).toBe('2026-12-15')
    expect(addMonths(day('2027-03-31'), -13)).toBe('2026-02-28')
  })
})

describe('endOfMonth und endOfYear', () => {
  it('liefert das Monatsende inklusive Schaltjahr', () => {
    expect(endOfMonth(day('2027-02-01'))).toBe('2027-02-28')
    expect(endOfMonth(day('2028-02-10'))).toBe('2028-02-29')
    expect(endOfMonth(day('2027-04-30'))).toBe('2027-04-30')
    expect(endOfMonth(day('2027-12-05'))).toBe('2027-12-31')
  })

  it('liefert den 31.12. des Jahres', () => {
    expect(endOfYear(day('2027-01-01'))).toBe('2027-12-31')
  })
})
