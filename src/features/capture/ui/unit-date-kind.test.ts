import { describe, expect, it } from 'vitest'
import { kindAfterTyping, kindChangeNote } from './unit-date-kind'

describe('kindAfterTyping („Datum ändern“, #300)', () => {
  it('schaltet auf Verbrauchsdatum, sobald „zu verbrauchen bis“ dasteht', () => {
    expect(
      kindAfterTyping({
        previousText: 'zu verbrauchen bi',
        nextText: 'zu verbrauchen bis',
        kind: 'best-before',
      }),
    ).toBe('use-by')
  })

  it('behält eine bewusste Wahl MHD beim Weitertippen', () => {
    expect(
      kindAfterTyping({
        previousText: 'zu verbrauchen bis 03.12',
        nextText: 'zu verbrauchen bis 03.12.2026',
        kind: 'best-before',
      }),
    ).toBe('best-before')
  })

  it('stuft ein Verbrauchsdatum durch mitgetipptes „MHD“ nicht herab', () => {
    expect(
      kindAfterTyping({
        previousText: 'MHD 03.12.202',
        nextText: 'MHD 03.12.2026',
        kind: 'use-by',
      }),
    ).toBe('use-by')
    expect(
      kindAfterTyping({ previousText: '', nextText: 'mindestens haltbar bis', kind: 'use-by' }),
    ).toBe('use-by')
  })

  it('lässt die Art ohne Vorsatz, wie sie ist', () => {
    expect(kindAfterTyping({ previousText: '03.12', nextText: '03.12.2026', kind: 'use-by' })).toBe(
      'use-by',
    )
  })
})

describe('kindChangeNote', () => {
  it('schweigt, solange die Art der Zeile bleibt', () => {
    expect(kindChangeNote('best-before', 'best-before')).toBe('')
    expect(kindChangeNote('use-by', 'use-by')).toBe('')
  })

  it('sagt sichtbar, wenn ein Verbrauchsdatum zum MHD wird', () => {
    expect(kindChangeNote('use-by', 'best-before')).toBe(
      'Diese Packungen gelten danach als MHD, nicht mehr als Verbrauchsdatum.',
    )
  })

  it('sagt, wenn ein MHD zum Verbrauchsdatum wird', () => {
    expect(kindChangeNote('best-before', 'use-by')).toContain('nach diesem Tag nicht mehr essen')
  })
})
