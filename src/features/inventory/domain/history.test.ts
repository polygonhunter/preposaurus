import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import { groupByBerlinDay, periodStartDay } from './history'

const today = toCalendarDay('2026-11-24')

describe('periodStartDay', () => {
  it('rechnet heute in den Zeitraum ein', () => {
    expect(periodStartDay('30-days', today)).toBe('2026-10-26')
    expect(periodStartDay('3-months', today)).toBe('2026-08-25')
    expect(periodStartDay('12-months', today)).toBe('2025-11-25')
  })

  it('hat für „Alles“ keinen Anfang', () => {
    expect(periodStartDay('all', today)).toBeNull()
  })

  it('kommt mit Monatsenden zurecht', () => {
    expect(periodStartDay('3-months', toCalendarDay('2026-05-31'))).toBe('2026-03-01')
    expect(periodStartDay('12-months', toCalendarDay('2028-02-29'))).toBe('2027-03-01')
  })
})

describe('groupByBerlinDay', () => {
  const at = (iso: string) => ({ takenAt: new Date(iso), label: iso })

  it('bündelt aufeinanderfolgende Einträge eines Berliner Tages', () => {
    const days = groupByBerlinDay([
      at('2026-11-24T08:00:00Z'),
      at('2026-11-23T23:30:00Z'),
      at('2026-11-23T22:59:00Z'),
      at('2026-11-20T12:00:00Z'),
    ])

    expect(days.map(({ day, items }) => [day, items.length])).toEqual([
      ['2026-11-24', 2],
      ['2026-11-23', 1],
      ['2026-11-20', 1],
    ])
  })

  it('zählt im Sommer erst ab 22 Uhr UTC zum nächsten Tag', () => {
    const days = groupByBerlinDay([at('2026-07-01T22:00:00Z'), at('2026-07-01T21:59:00Z')])

    expect(days.map(({ day }) => day)).toEqual(['2026-07-02', '2026-07-01'])
  })

  it('liefert für nichts auch keine Tage', () => {
    expect(groupByBerlinDay([])).toEqual([])
  })
})
