import { describe, expect, it } from 'vitest'
import type { NodeTotalsDto } from '../schemas/shared'
import {
  countedText,
  daysCalculation,
  daysMeaningTexts,
  daysTitle,
  kcalOriginText,
  kcalText,
  notCountedTexts,
} from './detail-explain-text'
import { detailTiles } from './stock-format'

function totals(overrides: Partial<NodeTotalsDto> = {}): NodeTotalsDto {
  return {
    packages: 8,
    uncountedPackages: 0,
    amounts: { g: 4000, ml: 0 },
    kcal: 14320,
    waterMl: 0,
    macros: { protein: 0, carbs: 0, fat: 0 },
    productsWithoutMacros: 0,
    energyDays: 2.3,
    waterDays: 0,
    nextBestBefore: null,
    nextState: null,
    withoutDate: 0,
    estimatedKcalShare: 0,
    isApproximate: false,
    ...overrides,
  }
}

const need = { kcalPerDay: 6000, waterMlPerDay: 7500 }

describe('Erklär-Blatt der Kennwerte im Detail', () => {
  it('nennt die gezählten Packungen mit ihrer Menge', () => {
    expect(countedText(totals())).toBe('8 Packungen mit zusammen 4 kg zählen heute mit.')
    expect(countedText(totals({ packages: 1, amounts: { g: 500, ml: 0 } }))).toBe(
      '1 Packung mit zusammen 500 g zählt heute mit.',
    )
    expect(countedText(totals({ packages: 0, amounts: { g: 0, ml: 0 } }))).toBe(
      'Heute zählt keine Packung mit.',
    )
  })

  it('sagt, was nicht oder nur heute zählt', () => {
    expect(notCountedTexts(totals())).toEqual(['Alle Packungen im Vorrat zählen mit.'])
    expect(notCountedTexts(totals({ uncountedPackages: 1, withoutDate: 2 }))).toEqual([
      '1 Packung im Vorrat zählt heute nicht, weil ihr Datum vorbei ist.',
      '2 Packungen ohne Datum zählen heute mit, für das Zieldatum aber nicht.',
    ])
  })

  it('rechnet die Tage mit denselben Zahlen wie die Kacheln', () => {
    const tiles = detailTiles({ totals: totals() })
    expect(tiles.find((tile) => tile.label === 'Satt für')?.value).toBe('2,3 Tage')
    expect(daysCalculation(totals(), need)).toBe('14.320 kcal ÷ 6.000 kcal am Tag = 2,3 Tage')
  })

  it('rechnet Wasser in Litern statt in kcal', () => {
    const water = totals({ kcal: 0, amounts: { g: 0, ml: 18000 }, waterMl: 18000, waterDays: 2.4 })
    expect(daysCalculation(water, need)).toBe('18 l ÷ 7,5 l am Tag = 2,4 Tage')
    expect(kcalText(water)).toBe('Wasser hat keine kcal. Es zählt in Litern, als Wasser.')
    expect(kcalOriginText(water)).toBeNull()
  })

  it('zählt ein Getränk ohne kcal nicht als Wasser (#260)', () => {
    const tea = totals({ kcal: 0, amounts: { g: 0, ml: 6000 }, energyDays: 0, waterDays: 0 })
    expect(daysCalculation(tea, need)).toBe('0 kcal ÷ 6.000 kcal am Tag = 0 Tage')
    expect(kcalText(tea)).toBe('Dieses Getränk zählt mit 0 kcal.')
    expect(kcalOriginText(tea)).toBeNull()
    const meaning = daysMeaningTexts(tea).join(' ')
    expect(meaning).toContain('nur die Warengruppe Wasser')
    expect(meaning).not.toContain('dieses Wasser')
  })

  it('nennt bei Wasser mit kcal die kcal statt „Wasser hat keine kcal“ (#260)', () => {
    const flavoured = totals({ kcal: 300, amounts: { g: 0, ml: 6000 }, waterMl: 6000 })
    expect(kcalText(flavoured)).toBe(
      'Je Packung: Inhalt × kcal je 100 g bzw. ml ÷ 100. Zusammen 300 kcal.',
    )
  })

  it('setzt „ca.“ in die Rechnung, wenn die Kachel „ca.“ trägt (#260)', () => {
    const approximate = totals({ isApproximate: true })
    expect(daysCalculation(approximate, need)).toBe(
      'ca. 14.320 kcal ÷ 6.000 kcal am Tag = 2,3 Tage',
    )
    expect(detailTiles({ totals: approximate }).find((tile) => tile.label === 'kcal')?.value).toBe(
      'ca. 14.320',
    )
  })

  it('zeigt ohne Bedarf keine Rechnung, sagt aber warum', () => {
    const noNeed = totals({ energyDays: null, waterDays: null })
    expect(daysCalculation(noNeed, { kcalPerDay: 0, waterMlPerDay: 0 })).toBeNull()
    expect(daysMeaningTexts(noNeed)[0]).toContain('Mitglieder und eine Empfehlung')
  })

  it('nennt „Satt für“ und grenzt es von „Menge reicht“ ab (#209)', () => {
    const texts = daysMeaningTexts(totals()).join(' ')
    expect(daysTitle(totals())).toBe('Satt für')
    expect(texts).toContain('„Satt für“: So lange machen die kcal')
    expect(texts).toContain('„Menge reicht … von … Tagen“')
  })

  it('nennt Wasser „Wasser für“, weil es keine kcal hat (#209)', () => {
    const water = totals({ kcal: 0, amounts: { g: 0, ml: 18000 }, waterMl: 18000, waterDays: 2.4 })
    expect(daysTitle(water)).toBe('Wasser für')
    expect(daysMeaningTexts(water).join(' ')).toContain('deshalb steht hier nicht „Satt für“')
  })

  it('erklärt kcal und „ca.“ mit dem Anteil der Richtwerte', () => {
    expect(kcalText(totals())).toContain('Zusammen 14.320 kcal.')
    expect(kcalText(totals({ isApproximate: true }))).toContain('Zusammen ca. 14.320 kcal.')
    expect(kcalOriginText(totals())).toBe('Alle kcal stammen von den Etiketten.')
    expect(kcalOriginText(totals({ estimatedKcalShare: 0.4 }))).toBe(
      'Bei etwa 40 % der kcal fehlt die Nährwerttabelle, dort zählt der Richtwert der Lebensmittelart oder eine Schätzung. „ca.“ steht ab 10 %.',
    )
  })
})
