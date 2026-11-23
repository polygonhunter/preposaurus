import { describe, expect, it } from 'vitest'
import type { OverviewGroup } from '../schemas'
import {
  GROUP_MEANING_TEXTS,
  groupCalculation,
  groupResultText,
  groupTargetText,
} from './group-explain-text'
import { coverageText } from './list-text'

// 7 kg Getreide gegen 1,05 kg am Tag (3 Personen à 350 g), Ziel 10 Tage: 6,66 → 6,6 Tage
const grain: OverviewGroup = {
  key: 'getreide',
  name: 'Getreide, Getreideprodukte, Brot und Kartoffeln',
  shortName: 'Getreide und Kartoffeln',
  days: 6.6,
  goalDays: 10,
  isTightest: false,
  unit: 'g',
  stock: 7000,
  targetPerDay: 1050,
}

describe('Erklär-Blatt einer Warengruppe', () => {
  it('rechnet Bestand ÷ Zielmenge je Tag = Tage', () => {
    expect(groupCalculation(grain)).toBe('7 kg ÷ 1,05 kg am Tag = 6,6 Tage')
  })

  it('nennt dieselben Tage wie der Balken', () => {
    expect(coverageText(grain)).toBe('6,6 von 10 Tagen')
    expect(groupResultText(grain)).toContain('für 6,6 Tage, euer Ziel sind 10 Tage.')
  })

  it('rechnet kleine Mengen in g bzw. ml', () => {
    const milk = { ...grain, unit: 'ml' as const, stock: 500, targetPerDay: 750, days: 0.6 }
    expect(groupCalculation(milk)).toBe('500 ml ÷ 750 ml am Tag = 0,6 Tage')
  })

  it('sagt „1 Tag“ in der Einzahl', () => {
    expect(groupCalculation({ ...grain, stock: 1050, days: 1 })).toBe(
      '1,05 kg ÷ 1,05 kg am Tag = 1 Tag',
    )
  })

  it('nennt die Zielmenge des Haushalts je Tag', () => {
    expect(groupTargetText(grain)).toContain('zusammen 1,05 kg am Tag')
  })

  it('unterscheidet die Abdeckung vom Beitrag in kcal (#209)', () => {
    expect(GROUP_MEANING_TEXTS.join(' ')).toMatch(/nicht wie lange das Essen reicht/)
    expect(GROUP_MEANING_TEXTS.join(' ')).toMatch(/Beitrag zum Essen/)
  })
})
