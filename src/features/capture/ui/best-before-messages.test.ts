import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import { dateEntryKey, type DateEntry } from '../domain/date-entries'
import { kindChangedNote } from './best-before-messages'

const useBy: DateEntry = {
  bestBefore: { date: toCalendarDay('2027-09-30'), precision: 'month', isEstimated: false },
  count: 3,
  kind: 'use-by',
}

describe('kindChangedNote (#294)', () => {
  it('sagt das Zusammenführen mit Datum und neuer Anzahl an', () => {
    expect(kindChangedNote([useBy], dateEntryKey(useBy), true)).toBe(
      'Zusammengeführt mit 09/2027 (Verbrauchsdatum), jetzt 3×.',
    )
  })

  it('bleibt leer, wenn nur die Art wechselt', () => {
    expect(kindChangedNote([useBy], dateEntryKey(useBy), false)).toBe('')
  })
})
