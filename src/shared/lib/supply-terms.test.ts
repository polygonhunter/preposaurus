import { describe, expect, it } from 'vitest'
import {
  amountDays,
  coverageValue,
  DAYS_TERM,
  formatDays,
  namedDaysText,
  supplyDays,
} from './supply-terms'

describe('Namen der Tage-Zahlen (#209)', () => {
  it('nennt die Abdeckung nach Menge „Menge reicht … von … Tagen“', () => {
    expect(namedDaysText(amountDays(6.6, 10))).toBe('Menge reicht 6,6 von 10 Tagen')
  })

  it('nennt den Beitrag nach kcal „Satt für … Tage“', () => {
    expect(namedDaysText(supplyDays('food', 4.1))).toBe('Satt für 4,1 Tage')
  })

  it('nennt Wasser „Wasser für … Tage“, weil Wasser keine kcal hat', () => {
    expect(namedDaysText(supplyDays('water', 3.2))).toBe('Wasser für 3,2 Tage')
  })

  it('hält Name und Wert getrennt, damit sie verschieden gesetzt werden können', () => {
    expect(amountDays(3, 10)).toEqual({ label: DAYS_TERM.amount, value: '3 von 10 Tagen' })
    expect(supplyDays('food', 0.2)).toEqual({ label: 'Satt für', value: '0,2 Tage' })
  })

  it('verwechselt die Namen nicht', () => {
    expect(new Set(Object.values(DAYS_TERM)).size).toBe(Object.keys(DAYS_TERM).length)
  })
})

describe('formatDays', () => {
  it('sagt „1 Tag“ in der Einzahl', () => {
    expect(formatDays(1)).toBe('1 Tag')
    expect(namedDaysText(supplyDays('food', 1))).toBe('Satt für 1 Tag')
  })

  it('rundet auf eine Nachkommastelle', () => {
    expect(formatDays(3.24)).toBe('3,2 Tage')
    expect(formatDays(0)).toBe('0 Tage')
  })
})

describe('coverageValue', () => {
  it('nennt Bestand und Ziel in Tagen', () => {
    expect(coverageValue(12, 40)).toBe('12 von 40 Tagen')
    expect(coverageValue(0.04, 10)).toBe('0 von 10 Tagen')
  })
})
