import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import { changeBestBefore } from './change-best-before'
import type { BestBefore, StockUnit } from './unit'

const bestBefore = (date: string, overrides: Partial<BestBefore> = {}): BestBefore => ({
  date: toCalendarDay(date),
  precision: 'day',
  isEstimated: false,
  ...overrides,
})

const checkedOn = toCalendarDay('2026-11-20')

// Abgelaufen und am 20.11. als „Noch gut“ geprüft
const stillGood: StockUnit = {
  id: 'reis',
  status: 'stock',
  bestBefore: bestBefore('2026-10-31'),
  kind: 'best-before',
  checkedAt: checkedOn,
}

describe('changeBestBefore', () => {
  it('setzt „Noch gut“ zurück, wenn sich das Datum ändert', () => {
    const changed = changeBestBefore(stillGood, bestBefore('2027-03-31'))

    expect(changed.bestBefore).toEqual(bestBefore('2027-03-31'))
    expect(changed.checkedAt).toBeNull()
  })

  it('setzt „Noch gut“ auch zurück, wenn das neue Datum wieder abgelaufen ist', () => {
    expect(changeBestBefore(stillGood, bestBefore('2026-09-30')).checkedAt).toBeNull()
  })

  it('setzt „Noch gut“ zurück, wenn das Datum entfernt wird („Datum fehlt“)', () => {
    const changed = changeBestBefore(stillGood, null)

    expect(changed.bestBefore).toBeNull()
    expect(changed.checkedAt).toBeNull()
  })

  it('behält „Noch gut“, wenn der Tag gleich bleibt und sich nur die Genauigkeit ändert', () => {
    const sameDay = bestBefore('2026-10-31', { precision: 'month' })

    expect(changeBestBefore(stillGood, sameDay)).toEqual({ ...stillGood, bestBefore: sameDay })
  })

  it('trägt ein Datum bei einer Packung ohne Datum nach, ohne eine Prüfung zu erfinden', () => {
    const undated = { ...stillGood, bestBefore: null, checkedAt: null }

    expect(changeBestBefore(undated, bestBefore('2027-05-31'))).toEqual({
      ...undated,
      bestBefore: bestBefore('2027-05-31'),
    })
  })

  it('lässt alle übrigen Felder und die Eingabe unverändert', () => {
    const before = structuredClone(stillGood)
    const changed = changeBestBefore(stillGood, bestBefore('2027-03-31'))

    expect(stillGood).toEqual(before)
    expect(changed).toMatchObject({ id: 'reis', status: 'stock', kind: 'best-before' })
  })
})
