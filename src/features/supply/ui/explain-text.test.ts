import { describe, expect, it } from 'vitest'
import type { OverviewExplanation, OverviewSupply } from '../schemas'
import {
  approximateText,
  caveatTexts,
  energyCalculation,
  needLineText,
  needTotalText,
  resultText,
  waterCalculation,
} from './explain-text'

// TESTDATEN: 2 Erwachsene und 1 Kind, frei gewählte Bedarfswerte
const adults = { type: 'adult' as const, count: 2, kcalPerDay: 2300, waterMlPerDay: 2500 }
const child = { type: 'child' as const, count: 1, kcalPerDay: 1400, waterMlPerDay: 1000 }

const explanation: OverviewExplanation = {
  kcal: 31965,
  waterMl: 18000,
  kcalPerDay: 6000,
  waterMlPerDay: 6000,
  needLines: [adults, child],
  uncountedMembers: 0,
  estimatedShare: 0,
  packages: { expired: 0, stillGood: 0, missingDate: 0 },
  stillGoodCounts: false,
}

const supply: OverviewSupply = {
  days: 3,
  energyDays: 5.3,
  waterDays: 3,
  bottleneck: 'water',
  isApproximate: false,
  explanation,
}

describe('Bedarf', () => {
  it('nennt je Personengruppe Anzahl und Bedarf je Person', () => {
    expect(needLineText(adults)).toBe('2 Erwachsene: je 2.300 kcal und 2,5 l Wasser am Tag')
    expect(needLineText(child)).toBe('1 Kind: je 1.400 kcal und 1 l Wasser am Tag')
  })

  it('nennt die Summe und Babys, die noch nicht mitzählen', () => {
    expect(needTotalText(explanation)).toBe(
      'Zusammen braucht ihr 6.000 kcal und 6 l Wasser am Tag.',
    )
    expect(needTotalText({ ...explanation, uncountedMembers: 2 })).toContain(
      '2 Babys zählen noch nicht mit',
    )
  })
})

describe('Rechnung', () => {
  it('teilt Vorrat durch Bedarf, für Essen und Wasser', () => {
    expect(energyCalculation(supply)).toBe('31.965 kcal ÷ 6.000 kcal am Tag = 5,3 Tage')
    expect(waterCalculation(supply)).toBe('18 l ÷ 6 l am Tag = 3 Tage')
  })

  it('sagt, welcher Wert zählt', () => {
    expect(resultText(supply)).toBe(
      'Es zählt der kleinere Wert, hier Wasser: 3 Tage. Oben steht die Zahl in ganzen Tagen, abgerundet.',
    )
    expect(resultText({ ...supply, energyDays: 3 })).toContain(
      'Essen und Wasser reichen gleich lang',
    )
  })
})

describe('approximateText', () => {
  it('sagt ohne Richtwerte, dass die Zahl genau ist', () => {
    expect(approximateText(explanation)).toBe(
      'Alle kcal stammen von den Etiketten. Die Zahl ist genau.',
    )
  })

  it('nennt den Anteil und erklärt „ca.“ ab der Schwelle', () => {
    const text = approximateText({ ...explanation, estimatedShare: 0.123 })
    expect(text).toContain('etwa 12 %')
    expect(text).toContain('Ab 10 %')
    expect(text).toContain('Tragt die Werte vom Etikett nach')
  })

  it('sagt unter der Schwelle, warum kein „ca.“ steht', () => {
    expect(approximateText({ ...explanation, estimatedShare: 0.004 })).toContain('weniger als 1 %')
    expect(approximateText({ ...explanation, estimatedShare: 0.05 })).toContain(
      'Hier ist es weniger.',
    )
  })
})

describe('caveatTexts', () => {
  it('sagt, wenn alles mitzählt', () => {
    expect(caveatTexts(explanation)).toEqual(['Alle Packungen im Vorrat zählen mit.'])
  })

  it('nennt je Grund einen Satz, in Einzahl und Mehrzahl', () => {
    const packages = { expired: 1, stillGood: 2, missingDate: 3 }
    expect(caveatTexts({ ...explanation, packages })).toEqual([
      '1 Packung ist abgelaufen und zählt nicht.',
      '2 Packungen sind abgelaufen, aber als „Noch gut“ geprüft. Sie zählen nicht, weil „Noch gut zählt mit“ ausgeschaltet ist.',
      '3 Packungen haben kein Datum. Sie zählen heute mit, für das Zieldatum aber nicht.',
    ])
  })

  it('richtet „Noch gut“ nach dem Schalter', () => {
    const packages = { expired: 0, stillGood: 1, missingDate: 0 }
    expect(caveatTexts({ ...explanation, packages, stillGoodCounts: true })).toEqual([
      '1 Packung ist abgelaufen, aber als „Noch gut“ geprüft. Sie zählt heute mit, weil „Noch gut zählt mit“ eingeschaltet ist.',
    ])
  })
})
