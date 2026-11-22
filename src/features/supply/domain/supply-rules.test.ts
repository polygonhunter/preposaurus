import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import { isCountedOn, roundDownDays, type ReferenceDay } from './supply-rules'
import { supplyUnit } from '../../../../tests/helpers/supply-units'

const today: ReferenceDay = { day: toCalendarDay('2026-11-22'), kind: 'today' }
const target: ReferenceDay = { day: toCalendarDay('2027-03-31'), kind: 'target' }
const stillGood = supplyUnit('geprueft', '2026-10-31', { checkedAt: '2026-11-20' })

describe('isCountedOn', () => {
  it('zählt eine haltbare Einheit im Vorrat, auch mit MHD genau am Stichtag', () => {
    expect(isCountedOn(supplyUnit('a', '2026-11-22'), today, false)).toBe(true)
    expect(isCountedOn(supplyUnit('b', '2027-03-31'), target, false)).toBe(true)
  })

  it('zählt abgelaufene, verbrauchte und entsorgte Einheiten nicht', () => {
    expect(isCountedOn(supplyUnit('a', '2026-11-21'), today, false)).toBe(false)
    expect(isCountedOn(supplyUnit('b', '2028-01-31', { status: 'consumed' }), today, false)).toBe(
      false,
    )
    expect(isCountedOn(supplyUnit('c', '2028-01-31', { status: 'discarded' }), today, false)).toBe(
      false,
    )
  })

  it('zählt „Noch gut“ heute nicht, wenn der Schalter aus ist', () => {
    expect(isCountedOn(stillGood, today, false)).toBe(false)
  })

  it('zählt „Noch gut“ heute, wenn der Haushalt es eingestellt hat', () => {
    expect(isCountedOn(stillGood, today, true)).toBe(true)
  })

  it('zählt „Noch gut“ am Zieldatum nie, auch nicht mit Einstellung', () => {
    expect(isCountedOn(stillGood, target, true)).toBe(false)
  })

  it('zählt „Noch gut“ am Zieldatum auch dann nicht, wenn das Zieldatum heute ist', () => {
    expect(isCountedOn(stillGood, { day: today.day, kind: 'target' }, true)).toBe(false)
  })

  it('zählt eine abgelaufene, ungeprüfte Einheit auch mit Einstellung nicht', () => {
    expect(isCountedOn(supplyUnit('a', '2026-10-31'), today, true)).toBe(false)
  })
})

describe('isCountedOn ohne Datum', () => {
  const withoutDate = supplyUnit('ohne', null)

  it('zählt heute mit', () => {
    expect(isCountedOn(withoutDate, today, false)).toBe(true)
  })

  it('zählt am Zieldatum nicht, auch wenn das Zieldatum heute ist', () => {
    expect(isCountedOn(withoutDate, target, false)).toBe(false)
    expect(isCountedOn(withoutDate, { day: today.day, kind: 'target' }, false)).toBe(false)
  })

  it('zählt verbraucht oder entsorgt auch heute nicht', () => {
    expect(isCountedOn(supplyUnit('a', null, { status: 'consumed' }), today, false)).toBe(false)
    expect(isCountedOn(supplyUnit('b', null, { status: 'discarded' }), today, false)).toBe(false)
  })
})

describe('roundDownDays', () => {
  it('rundet auf eine Nachkommastelle ab und verträgt Gleitkomma-Rauschen', () => {
    expect(roundDownDays(2.99)).toBe(2.9)
    expect(roundDownDays(0.7)).toBe(0.7)
  })
})
