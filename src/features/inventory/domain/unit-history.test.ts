import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import { historyEventsOf, type UnitHistoryRow } from './unit-history'

const bestBefore = {
  date: toCalendarDay('2026-11-01'),
  precision: 'day' as const,
  isEstimated: false,
}

const row = (overrides: Partial<UnitHistoryRow>): UnitHistoryRow => ({
  status: 'stock',
  takenAt: null,
  takenBy: null,
  checkedAt: null,
  bestBefore,
  ...overrides,
})

describe('historyEventsOf (Verlauf je Lebensmittelart)', () => {
  it('nennt Entnahmen mit Tag in Berlin und Person, „Noch gut“ ohne Person', () => {
    const rows = [
      // 23:30 UTC ist in Berlin schon der nächste Tag
      row({ status: 'discarded', takenAt: new Date('2026-11-21T23:30:00Z'), takenBy: 'Alex' }),
      row({ checkedAt: toCalendarDay('2026-11-20') }),
    ]

    expect(historyEventsOf(rows, 10)).toEqual([
      { kind: 'discarded', day: '2026-11-22', person: 'Alex', bestBefore },
      { kind: 'still-good', day: '2026-11-20', person: null, bestBefore },
    ])
  })

  it('zeigt eine geprüfte und später verbrauchte Packung zweimal, neueste zuerst', () => {
    const rows = [
      row({
        status: 'consumed',
        takenAt: new Date('2026-11-23T10:00:00Z'),
        takenBy: 'Sam',
        checkedAt: toCalendarDay('2026-11-23'),
      }),
      row({ status: 'consumed', takenAt: new Date('2026-11-22T10:00:00Z'), takenBy: null }),
    ]

    expect(historyEventsOf(rows, 10).map((event) => [event.kind, event.day])).toEqual([
      ['consumed', '2026-11-23'],
      ['still-good', '2026-11-23'],
      ['consumed', '2026-11-22'],
    ])
  })

  it('kürzt auf die gewünschte Länge', () => {
    const rows = [
      row({ checkedAt: toCalendarDay('2026-11-20') }),
      row({ checkedAt: toCalendarDay('2026-11-19') }),
    ]

    expect(historyEventsOf(rows, 1)).toHaveLength(1)
  })
})
