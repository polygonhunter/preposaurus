import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import { pickFifoUnit } from './fifo'
import type { StockUnit, UnitStatus } from './unit'

function unit(
  id: string,
  date: string | null,
  options: { status?: UnitStatus; estimated?: boolean } = {},
): StockUnit {
  return {
    id,
    status: options.status ?? 'stock',
    bestBefore:
      date === null
        ? null
        : { date: toCalendarDay(date), precision: 'day', isEstimated: options.estimated ?? false },
    kind: 'best-before',
    checkedAt: null,
  }
}

describe('pickFifoUnit', () => {
  it('wählt die Einheit mit dem frühesten MHD', () => {
    const units = [unit('a', '2027-11-30'), unit('b', '2027-09-30'), unit('c', '2028-01-31')]
    expect(pickFifoUnit(units)?.id).toBe('b')
  })

  it('wählt bei gleichem MHD die zuerst genannte Einheit', () => {
    const units = [unit('a', '2027-09-30'), unit('b', '2027-09-30')]
    expect(pickFifoUnit(units)?.id).toBe('a')
  })

  it('übergeht verbrauchte und entsorgte Einheiten', () => {
    const units = [
      unit('a', '2027-01-31', { status: 'consumed' }),
      unit('b', '2027-02-28', { status: 'discarded' }),
      unit('c', '2027-09-30'),
    ]
    expect(pickFifoUnit(units)?.id).toBe('c')
  })

  it('schlägt auch abgelaufene Einheiten zuerst vor', () => {
    const units = [unit('a', '2027-09-30'), unit('b', '2025-01-31')]
    expect(pickFifoUnit(units)?.id).toBe('b')
  })

  it('behandelt geschätzte Daten wie erkannte', () => {
    const units = [unit('a', '2027-09-30'), unit('b', '2027-06-30', { estimated: true })]
    expect(pickFifoUnit(units)?.id).toBe('b')
  })

  it('liefert null bei leerer Liste oder ohne Einheit im Vorrat', () => {
    expect(pickFifoUnit([])).toBeNull()
    expect(pickFifoUnit([unit('a', '2027-09-30', { status: 'consumed' })])).toBeNull()
  })

  describe('Packungen ohne Datum', () => {
    it('kommen nach allen Packungen mit Datum, auch nach weit entfernten', () => {
      const units = [unit('ohne', null), unit('spaet', '2035-12-31'), unit('frueh', '2027-09-30')]
      expect(pickFifoUnit(units)?.id).toBe('frueh')
    })

    it('kommen auch nach abgelaufenen Packungen', () => {
      const units = [unit('ohne', null), unit('abgelaufen', '2025-01-31')]
      expect(pickFifoUnit(units)?.id).toBe('abgelaufen')
    })

    it('werden vorgeschlagen, wenn nur noch sie im Vorrat sind, die zuerst genannte zuerst', () => {
      const units = [
        unit('verbraucht', '2027-01-31', { status: 'consumed' }),
        unit('ohne-1', null),
        unit('ohne-2', null),
      ]
      expect(pickFifoUnit(units)?.id).toBe('ohne-1')
    })

    it('übergeht verbrauchte Packungen ohne Datum', () => {
      expect(pickFifoUnit([unit('ohne', null, { status: 'consumed' })])).toBeNull()
    })
  })
})
