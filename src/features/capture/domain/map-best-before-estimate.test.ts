import { describe, expect, it } from 'vitest'
import { addMonths, normalizeToPrecision, toCalendarDay } from '@/shared/lib/dates'
import type { AiBestBeforeEstimateAnswer } from './ai-answers'
import { mapBestBeforeEstimateAnswer } from './map-best-before-estimate'

const today = toCalendarDay('2026-11-22')

const answer = (overrides: Partial<AiBestBeforeEstimateAnswer>): AiBestBeforeEstimateAnswer => ({
  haltbar_monate: 18,
  sicherheit: 'mittel',
  ...overrides,
})

describe('mapBestBeforeEstimateAnswer', () => {
  it('rechnet ab heute zum Monatsende und kennzeichnet als geschätzt', () => {
    expect(mapBestBeforeEstimateAnswer(answer({}), today)).toEqual({
      bestBefore: { date: '2028-05-31', precision: 'month', isEstimated: true },
      confidence: 'medium',
    })
  })

  it('setzt nie das Jahresende, auch nicht über den Jahreswechsel (#170)', () => {
    const result = mapBestBeforeEstimateAnswer(answer({ haltbar_monate: 14 }), today)

    expect(result.bestBefore).toEqual({ date: '2028-01-31', precision: 'month', isEstimated: true })
  })

  it.each([1, 2, 6, 13, 14, 25, 120])(
    'hält bei %s Monaten nie länger als bis zum Ende des geschätzten Monats',
    (months) => {
      const { bestBefore } = mapBestBeforeEstimateAnswer(answer({ haltbar_monate: months }), today)

      expect(bestBefore?.date).toBe(normalizeToPrecision(addMonths(today, months), 'month'))
      expect(bestBefore?.precision).toBe('month')
    },
  )

  it('rundet auf ganze Monate', () => {
    const result = mapBestBeforeEstimateAnswer(answer({ haltbar_monate: 2.4 }), today)

    expect(result.bestBefore?.date).toBe('2027-01-31')
  })

  it.each([null, 0, -3, 0.4, 361, Number.NaN, Number.POSITIVE_INFINITY])(
    'ergibt bei %s keine Schätzung, das Datum bleibt leer',
    (months) => {
      const result = mapBestBeforeEstimateAnswer(answer({ haltbar_monate: months }), today)

      expect(result.bestBefore).toBeNull()
    },
  )

  it('liefert nie ein taggenaues oder ungekennzeichnetes Datum', () => {
    for (const months of [1, 6, 12, 24, 60, 360]) {
      const { bestBefore } = mapBestBeforeEstimateAnswer(answer({ haltbar_monate: months }), today)
      expect(bestBefore?.isEstimated).toBe(true)
      expect(bestBefore?.precision).toBe('month')
    }
  })
})
