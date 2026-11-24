import { describe, expect, it } from 'vitest'
import type { OverviewGroup } from '../schemas'
import {
  GROUP_MEANING_TEXTS,
  groupCalculation,
  groupResultText,
  groupTargetText,
  satietyCalculation,
  satietyResultText,
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
  satiety: { kcal: 23450, isApproximate: false, kcalPerDay: 6000, days: 3.9 },
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

  it('rechnet „Satt für“ mit kcal ÷ kcal-Tagesbedarf aus dem DTO (#209)', () => {
    expect(satietyCalculation(grain)).toBe('23.450 kcal ÷ 6.000 kcal am Tag = 3,9 Tage')
    expect(satietyResultText(grain)).toContain('allein euren ganzen Haushalt satt: 3,9 Tage')
  })

  it('setzt „ca.“ vor die kcal, wenn Richtwerte spürbar mitzählen', () => {
    const approximate = {
      ...grain,
      satiety: { kcal: 23450, isApproximate: true, kcalPerDay: 6000, days: 3.9 },
    }
    expect(satietyCalculation(approximate)).toBe('ca. 23.450 kcal ÷ 6.000 kcal am Tag = 3,9 Tage')
  })

  it('zeigt ohne Bedarf keine kcal-Rechnung, sagt aber warum', () => {
    const noNeed = { ...grain, satiety: null }
    expect(satietyCalculation(noNeed)).toBeNull()
    expect(satietyResultText(noNeed)).toContain('sobald Mitglieder eingetragen sind')
  })

  it('benennt beide Zahlen und was sie messen (#209)', () => {
    const texts = GROUP_MEANING_TEXTS.join(' ')
    expect(texts).toContain('„Menge reicht“ vergleicht die Menge mit der Empfehlung')
    expect(texts).toContain('„Satt für“ rechnet mit den kcal')
  })
})
