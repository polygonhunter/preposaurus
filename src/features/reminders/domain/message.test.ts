import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import { dueItem } from '../../../../tests/helpers/due-items'
import { countWithNoun, describeDue, nameItems, sortByDate, totalUnits } from './message'

const today = toCalendarDay('2026-11-22')

describe('countWithNoun', () => {
  it('wählt Einzahl und Mehrzahl', () => {
    expect(countWithNoun(1, 'Packung', 'Packungen')).toBe('1 Packung')
    expect(countWithNoun(3, 'Packung', 'Packungen')).toBe('3 Packungen')
  })
})

describe('totalUnits', () => {
  it('zählt die Packungen aller Einträge', () => {
    const items = [dueItem('Reis', '2026-11-25', { unitCount: 2 }), dueItem('Mehl', '2026-11-26')]
    expect(totalUnits(items)).toBe(3)
  })
})

describe('sortByDate', () => {
  it('sortiert nach Datum, bei Gleichstand nach Name', () => {
    const items = [
      dueItem('Reis', '2026-11-27'),
      dueItem('Mehl', '2026-11-25'),
      dueItem('Linsen', '2026-11-25'),
    ]
    expect(sortByDate(items).map((item) => item.label)).toEqual(['Linsen', 'Mehl', 'Reis'])
  })
})

describe('nameItems', () => {
  it('nennt einen Namen allein', () => {
    expect(nameItems([dueItem('Reis', '2026-11-25')])).toBe('Reis')
  })

  it('verbindet bis zu drei Namen mit „und“, früheste zuerst', () => {
    const items = [
      dueItem('Reis', '2026-11-27'),
      dueItem('Thunfisch', '2026-11-24'),
      dueItem('Linsen', '2026-11-25'),
    ]
    expect(nameItems(items)).toBe('Thunfisch, Linsen und Reis')
  })

  it('fasst ab dem vierten Namen zusammen und nennt jeden Namen nur einmal', () => {
    const items = [
      dueItem('Reis', '2026-11-23'),
      dueItem('Reis', '2026-11-24'),
      dueItem('Linsen', '2026-11-25'),
      dueItem('Mehl', '2026-11-26'),
      dueItem('Zucker', '2026-11-27'),
      dueItem('Salz', '2026-11-28'),
    ]
    expect(nameItems(items)).toBe('Reis, Linsen, Mehl und 2 weitere')
  })
})

describe('describeDue', () => {
  const bestBefore = (date: string) => dueItem('x', date).bestBefore

  it.each([
    ['2026-11-22', 'läuft heute ab'],
    ['2026-11-23', 'läuft morgen ab'],
    ['2026-11-29', 'läuft in 7 Tagen ab'],
  ])('beschreibt %s als „%s“', (date, text) => {
    expect(describeDue(bestBefore(date), today)).toBe(text)
  })

  it('nennt bei Monat oder Jahr das aufgedruckte Datum statt der Tage', () => {
    const monthOnly = dueItem('x', '2026-11-30', { precision: 'month' }).bestBefore
    expect(describeDue(monthOnly, today)).toBe('hat das Datum 11/2026')
  })

  it('kennzeichnet ein geschätztes Datum', () => {
    const estimated = dueItem('x', '2026-11-29', { isEstimated: true }).bestBefore
    expect(describeDue(estimated, today)).toBe('läuft in 7 Tagen ab (Datum geschätzt)')
  })
})
