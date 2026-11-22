import { describe, expect, it } from 'vitest'
import type { NodeTotalsDto } from '../schemas'
import {
  detailTiles,
  expiryHint,
  formatDate,
  formatPackages,
  formatTakenMessage,
  groupCoverageText,
  groupSubtitle,
  isEmptyStock,
  shelfLifeHint,
  stockLine,
} from './stock-format'

function totals(overrides: Partial<NodeTotalsDto> = {}): NodeTotalsDto {
  return {
    packages: 3,
    uncountedPackages: 0,
    amounts: { g: 1500, ml: 0 },
    kcal: 5385,
    macros: { protein: 0, carbs: 0, fat: 0 },
    productsWithoutMacros: 0,
    energyDays: null,
    waterDays: null,
    nextBestBefore: null,
    nextState: null,
    withoutDate: 0,
    estimatedKcalShare: 0,
    isApproximate: false,
    ...overrides,
  }
}

describe('Kennwerte als Text', () => {
  it('sagt Packung bzw. Packungen', () => {
    expect(formatPackages(1)).toBe('1 Packung')
    expect(formatPackages(1200)).toBe('1.200 Packungen')
  })

  it('nennt Packungen und Menge, kg und l nebeneinander', () => {
    expect(stockLine(3, totals())).toBe('3 Packungen · 1,5 kg')
    expect(stockLine(2, totals({ amounts: { g: 400, ml: 3000 } }))).toBe(
      '2 Packungen · 400 g · 3 l',
    )
    expect(stockLine(1, totals({ amounts: { g: 0, ml: 0 } }))).toBe('1 Packung')
  })

  it('zählt im Untertitel auch abgelaufene Packungen und nennt die Tage, wenn es sie gibt', () => {
    expect(groupSubtitle(totals({ uncountedPackages: 1 }))).toBe('4 Packungen · 1,5 kg')
    expect(groupSubtitle(totals({ energyDays: 2.64 }))).toBe('3 Packungen · 1,5 kg · 2,6 Tage')
    expect(groupSubtitle(totals({ energyDays: 1 }))).toBe('3 Packungen · 1,5 kg · 1 Tag')
  })

  it('rechnet Wasser in Wasser-Tagen', () => {
    const water = totals({ amounts: { g: 0, ml: 9000 }, kcal: 0, energyDays: 0, waterDays: 3 })

    expect(groupSubtitle(water)).toBe('3 Packungen · 9 l · 3 Tage')
  })

  it('zeigt auf Ebene 1 die Abdeckung mit Ziel, sonst die Tage, sonst nichts', () => {
    const coverage = {
      unit: 'g' as const,
      stock: 1,
      target: 2,
      days: 12.34,
      goalDays: 40,
      percent: 31,
      isTightest: false,
    }

    expect(groupCoverageText({ totals: totals(), coverage })).toBe('12,3 von 40 Tagen')
    expect(groupCoverageText({ totals: totals({ energyDays: 5 }), coverage: null })).toBe('5 Tage')
    expect(groupCoverageText({ totals: totals(), coverage: null })).toBeNull()
  })

  it('erkennt einen leeren Vorrat, abgelaufene Packungen zählen mit', () => {
    const empty = totals({ packages: 0 })

    expect(isEmptyStock([{ totals: empty }])).toBe(true)
    expect(isEmptyStock([{ totals: { ...empty, uncountedPackages: 1 } }])).toBe(false)
  })

  it('baut die Kacheln im Detail, Tage nur mit Bedarf, „ca.“ bei Richtwerten', () => {
    expect(detailTiles({ totals: totals({ isApproximate: true }) })).toEqual([
      { label: 'Packungen', value: '3' },
      { label: 'Menge', value: '1,5 kg' },
      { label: 'kcal', value: 'ca. 5.385' },
    ])
    const withDays = detailTiles({ totals: totals({ energyDays: 2.6, amounts: { g: 0, ml: 0 } }) })
    expect(withDays[1]).toEqual({ label: 'Menge', value: '–' })
    expect(withDays[3]).toEqual({ label: 'Tage', value: '2,6' })
  })
})

describe('Datum und Hinweise', () => {
  it('zeigt das MHD wie aufgedruckt, eine Schätzung mit Vermerk', () => {
    expect(formatDate({ date: '2027-09-30', precision: 'month', isEstimated: false })).toBe(
      '09/2027',
    )
    expect(formatDate({ date: '2027-09-30', precision: 'day', isEstimated: true })).toBe(
      '30.09.2027, geschätzt',
    )
  })

  it('beruhigt beim abgelaufenen MHD und warnt klar beim Verbrauchsdatum', () => {
    expect(expiryHint('expired', 'best-before')).toContain('kein Wegwerfdatum')
    expect(expiryHint('expired', 'use-by')).toContain('bitte nicht mehr essen')
    expect(expiryHint('urgent', 'use-by')).toBeNull()
  })

  it('formuliert die Rückgängig-Zeile mit und ohne Datum', () => {
    expect(formatTakenMessage('Nudeln', '11/2027')).toBe('Nudeln: 1 Packung verbraucht (11/2027)')
    expect(formatTakenMessage('Nudeln', null)).toBe('Nudeln: 1 Packung verbraucht')
  })

  it('nennt die übliche Haltbarkeit nur als Richtwert', () => {
    expect(shelfLifeHint(null)).toBeNull()
    expect(shelfLifeHint(1)).toContain('etwa 1 Monat haltbar')
    expect(shelfLifeHint(24)).toContain('Es zählt das Datum auf der Packung')
  })
})
