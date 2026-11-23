import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import { replacementCandidates, type ReplacementUnit } from './replacement-candidates'

// Frei gewählte Testdaten.
const today = toCalendarDay('2026-11-22')
const targetDay = toCalendarDay('2027-01-01')
const days = { today, targetDay }

function unit(overrides: Partial<ReplacementUnit> & Pick<ReplacementUnit, 'rowKey'>) {
  return {
    productId: `p-${overrides.rowKey}`,
    label: overrides.rowKey,
    status: 'stock' as const,
    bestBefore: toCalendarDay('2028-01-01'),
    takenOn: null,
    ...overrides,
  }
}

const consumed = (rowKey: string, takenOn: string) =>
  unit({ rowKey, status: 'consumed', takenOn: toCalendarDay(takenOn) })

describe('replacementCandidates: läuft vor dem Ziel ab', () => {
  it('schlägt eine Zeile vor, deren Packungen vor dem Zieldatum ablaufen', () => {
    const units = [
      unit({ rowKey: 'linsen', bestBefore: toCalendarDay('2026-12-20') }),
      unit({ rowKey: 'linsen', bestBefore: toCalendarDay('2026-12-10'), productId: 'p-dose' }),
      unit({ rowKey: 'linsen' }),
    ]

    expect(replacementCandidates(units, days)).toEqual([
      {
        rowKey: 'linsen',
        productIds: ['p-linsen', 'p-dose'],
        productId: 'p-dose',
        label: 'linsen',
        reason: { kind: 'expires', count: 2, firstDay: '2026-12-10' },
      },
    ])
  })

  it('zählt ein MHD am Zieldatum nicht und „Datum fehlt“ auch nicht', () => {
    const units = [
      unit({ rowKey: 'reis', bestBefore: targetDay }),
      unit({ rowKey: 'reis', bestBefore: null }),
    ]

    expect(replacementCandidates(units, days)).toEqual([])
  })

  it('nimmt auch schon Abgelaufenes mit', () => {
    const units = [unit({ rowKey: 'milch', bestBefore: toCalendarDay('2026-11-01') })]

    expect(replacementCandidates(units, days)[0]?.reason).toEqual({
      kind: 'expires',
      count: 1,
      firstDay: '2026-11-01',
    })
  })

  it('rechnet ohne Zieldatum nur „zuletzt verbraucht“', () => {
    const units = [
      unit({ rowKey: 'milch', bestBefore: toCalendarDay('2026-11-30') }),
      consumed('nudeln', '2026-11-20'),
    ]

    const result = replacementCandidates(units, { today, targetDay: null })

    expect(result.map(({ rowKey }) => rowKey)).toEqual(['nudeln'])
  })
})

describe('replacementCandidates: zuletzt verbraucht ohne Restbestand', () => {
  it('schlägt eine aufgebrauchte Zeile mit der letzten Entnahme vor', () => {
    const units = [consumed('nudeln', '2026-11-01'), consumed('nudeln', '2026-11-20')]

    expect(replacementCandidates(units, days)[0]?.reason).toEqual({
      kind: 'consumed',
      lastDay: '2026-11-20',
    })
  })

  it('lässt Zeilen mit Restbestand weg, auch wenn zuletzt etwas verbraucht wurde', () => {
    const units = [consumed('nudeln', '2026-11-20'), unit({ rowKey: 'nudeln' })]

    expect(replacementCandidates(units, days)).toEqual([])
  })

  it('zählt nur die letzten 30 Tage, der 30. Tag zählt noch', () => {
    const units = [consumed('alt', '2026-10-22'), consumed('grenze', '2026-10-23')]

    expect(replacementCandidates(units, days).map(({ rowKey }) => rowKey)).toEqual(['grenze'])
  })
})

describe('replacementCandidates: Reihenfolge', () => {
  it('nennt Ablaufendes zuerst nach MHD, dann Verbrauchtes, neuestes zuerst', () => {
    const units = [
      consumed('frueher', '2026-11-10'),
      unit({ rowKey: 'spaet', bestBefore: toCalendarDay('2026-12-30') }),
      consumed('neu', '2026-11-21'),
      unit({ rowKey: 'bald', bestBefore: toCalendarDay('2026-12-01') }),
    ]

    expect(replacementCandidates(units, days).map(({ rowKey }) => rowKey)).toEqual([
      'bald',
      'spaet',
      'neu',
      'frueher',
    ])
  })
})
