import { describe, expect, it } from 'vitest'
import { berlinClockAt, parseTimeOfDay } from './berlin-clock'

describe('berlinClockAt', () => {
  it('rechnet im Winter mit UTC+1', () => {
    expect(berlinClockAt(new Date('2026-11-28T09:00:00Z'))).toEqual({
      day: '2026-11-28',
      weekday: 6,
      minutes: 600,
    })
  })

  it('rechnet im Sommer mit UTC+2', () => {
    expect(berlinClockAt(new Date('2026-07-04T08:00:00Z'))).toEqual({
      day: '2026-07-04',
      weekday: 6,
      minutes: 600,
    })
  })

  it('wechselt um Mitternacht in Berlin den Tag, nicht um Mitternacht in UTC', () => {
    expect(berlinClockAt(new Date('2026-11-28T23:30:00Z'))).toEqual({
      day: '2026-11-29',
      weekday: 7,
      minutes: 30,
    })
  })

  it('zählt den Sonntag als Wochentag 7 und den Montag als 1', () => {
    expect(berlinClockAt(new Date('2026-11-29T12:00:00Z')).weekday).toBe(7)
    expect(berlinClockAt(new Date('2026-11-30T12:00:00Z')).weekday).toBe(1)
  })
})

describe('parseTimeOfDay', () => {
  it.each([
    ['10:00', 600],
    ['10:00:00', 600],
    ['00:00', 0],
    ['23:59', 1439],
  ])('liest %s als %i Minuten', (text, minutes) => {
    expect(parseTimeOfDay(text)).toBe(minutes)
  })

  it.each(['24:00', '9:00', '10:60', '', 'zehn'])('lehnt %s ab', (text) => {
    expect(parseTimeOfDay(text)).toBeNull()
  })
})
