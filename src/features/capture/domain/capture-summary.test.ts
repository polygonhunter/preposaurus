import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import { summarizeCapture } from './capture-summary'
import type { DateEntry } from './date-entries'

const entries: DateEntry[] = [
  {
    bestBefore: { date: toCalendarDay('2027-09-30'), precision: 'month', isEstimated: false },
    count: 4,
  },
  { bestBefore: null, count: 2 },
]

const noodles = { productName: 'Nudeln', content: { value: 500, unit: 'g' as const }, entries }

describe('summarizeCapture', () => {
  it('fasst Packungen, Menge, kcal und Daten zusammen', () => {
    expect(summarizeCapture({ ...noodles, kcal: { per100: 359, isEstimate: false } })).toEqual({
      packageCount: 6,
      headline: '6 × Nudeln 500 g',
      totals: ['3 kg', '10.770 kcal'],
      dates: '09/2027 (4×), Datum fehlt (2×)',
    })
  })

  it('markiert kcal aus dem Richtwert mit „ca.“', () => {
    const summary = summarizeCapture({ ...noodles, kcal: { per100: 358, isEstimate: true } })

    expect(summary.totals).toEqual(['3 kg', 'ca. 10.740 kcal'])
  })

  it('lässt kcal ohne Richtwert und alles Mengenbezogene ohne Inhalt weg', () => {
    expect(summarizeCapture({ ...noodles, kcal: null }).totals).toEqual(['3 kg'])

    const withoutContent = summarizeCapture({ ...noodles, content: null, kcal: null })
    expect(withoutContent.headline).toBe('6 × Nudeln')
    expect(withoutContent.totals).toEqual([])
  })
})
