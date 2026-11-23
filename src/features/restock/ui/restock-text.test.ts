import { describe, expect, it } from 'vitest'
import type { RestockListDto } from '../schemas'
import {
  emptyListText,
  formatGapAmount,
  gapSubtitle,
  NO_GOAL_TEXT,
  openCountText,
  suggestionReasonText,
} from './restock-text'

// Frei gewählte Testdaten.
const emptyList: RestockListDto = {
  isGoalCalculable: true,
  gaps: [],
  replace: [],
  suggestions: [],
  own: [],
  done: [],
  openItemCount: 0,
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
  it('nennt Tage am Ziel mit Beispielen und offene Einträge', () => {
    const gap = {
      groupKey: 'getreide',
      name: 'Getreide',
      missing: { value: 1, unit: 'g' as const },
      days: 6,
      goalDays: 10,
      examples: ['Nudeln', 'Reis'],
    }
    expect(gapSubtitle(gap)).toBe('6 von 10 Tagen · z. B. Nudeln, Reis')
    expect(gapSubtitle({ ...gap, examples: [] })).toBe('6 von 10 Tagen')
  })

  it('nennt offene Einträge, Vorschläge und Lücken getrennt', () => {
    const suggestion = {
      rowKey: 'food-type:linsen',
      productId: 'b1a0c7e2-0000-4000-8000-000000000009',
      label: 'Linsen',
      reason: { kind: 'consumed' as const, lastDay: '2026-11-20' },
    }
    const gap = {
      groupKey: 'wasser',
      name: 'Wasser',
      missing: { value: 1, unit: 'ml' as const },
      days: 6,
      goalDays: 10,
      examples: [],
    }
    expect(openCountText(emptyList)).toBe('0 Einträge offen')
    expect(openCountText({ ...emptyList, openItemCount: 1 })).toBe('1 Eintrag offen')
    expect(
      openCountText({
        ...emptyList,
        openItemCount: 3,
        suggestions: [suggestion, { ...suggestion, rowKey: 'food-type:reis' }],
        gaps: [gap],
      }),
    ).toBe('3 Einträge offen · 2 Vorschläge · 1 Warengruppe unter dem Ziel')
  })

  it('sagt im Leerzustand einen Satz, je nachdem, ob es ein Ziel gibt', () => {
    expect(emptyListText(emptyList)).toBe('Nichts offen. Euer Ziel ist erreicht.')
    expect(emptyListText({ ...emptyList, isGoalCalculable: false })).toBe(NO_GOAL_TEXT)
    expect(emptyListText({ ...emptyList, openItemCount: 1 })).toBeNull()
  })
})

describe('suggestionReasonText', () => {
  const suggestion = { rowKey: 'food-type:milch', productId: 'p', label: 'H-Milch' }

  it('sagt, wie viele Packungen vor dem Ziel ablaufen', () => {
    const expires = (count: number) => ({
      ...suggestion,
      reason: { kind: 'expires' as const, count, firstDay: '2026-12-01' },
    })
    expect(suggestionReasonText(expires(1))).toBe('Läuft vor dem Ziel ab')
    expect(suggestionReasonText(expires(3))).toBe('3 Packungen laufen vor dem Ziel ab')
  })

  it('nennt den Tag, an dem das Letzte aufgebraucht wurde', () => {
    const consumed = { ...suggestion, reason: { kind: 'consumed' as const, lastDay: '2026-11-20' } }
    expect(suggestionReasonText(consumed)).toBe('Am 20.11.2026 aufgebraucht')
  })
})
