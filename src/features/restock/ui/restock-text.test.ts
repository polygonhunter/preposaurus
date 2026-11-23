import { describe, expect, it } from 'vitest'
import type { RestockListDto } from '../schemas'
import {
  emptyListText,
  formatGapAmount,
  gapDaysText,
  NO_GOAL_TEXT,
  openCountText,
} from './restock-text'

// Frei gewählte Testdaten.
const emptyList: RestockListDto = {
  isGoalCalculable: true,
  gaps: [],
  replace: [],
  own: [],
  done: [],
  openCount: 0,
}

describe('formatGapAmount', () => {
  it('rundet Wasser auf ganze Liter auf', () => {
    expect(formatGapAmount({ value: 19_200, unit: 'ml' })).toBe('20 l')
    expect(formatGapAmount({ value: 300, unit: 'ml' })).toBe('1 l')
  })

  it('nennt große Mengen in kg mit einer Nachkommastelle, aufgerundet', () => {
    expect(formatGapAmount({ value: 3_410, unit: 'g' })).toBe('3,5 kg')
    expect(formatGapAmount({ value: 1_000, unit: 'g' })).toBe('1 kg')
  })

  it('nennt kleine Mengen in g, auf 10 g aufgerundet', () => {
    expect(formatGapAmount({ value: 432, unit: 'g' })).toBe('440 g')
  })
})

describe('Texte der Seite', () => {
  it('nennt Tage am Ziel und offene Einträge', () => {
    const gap = {
      groupKey: 'wasser',
      name: 'Wasser',
      missing: { value: 1, unit: 'ml' as const },
      days: 6,
      goalDays: 10,
    }
    expect(gapDaysText(gap)).toBe('6 von 10 Tagen')
    expect(openCountText({ ...emptyList, openCount: 3 })).toBe('3 offen')
    expect(openCountText(emptyList)).toBe('0 offen')
  })

  it('sagt im Leerzustand einen Satz, je nachdem, ob es ein Ziel gibt', () => {
    expect(emptyListText(emptyList)).toBe('Nichts offen. Euer Ziel ist erreicht.')
    expect(emptyListText({ ...emptyList, isGoalCalculable: false })).toBe(NO_GOAL_TEXT)
    expect(emptyListText({ ...emptyList, openCount: 1 })).toBeNull()
  })
})
