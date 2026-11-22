import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import type { AiBestBeforeEstimateAnswer } from './ai-answers'
import { mapBestBeforeEstimateAnswer } from './map-best-before-estimate'

const today = toCalendarDay('2026-11-22')

const answer = (overrides: Partial<AiBestBeforeEstimateAnswer>): AiBestBeforeEstimateAnswer => ({
  haltbar_monate: 18,
  genauigkeit: 'monat',
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

  it('bei Genauigkeit Jahr zum Jahresende', () => {
    const result = mapBestBeforeEstimateAnswer(answer({ genauigkeit: 'jahr' }), today)

    expect(result.bestBefore).toEqual({ date: '2028-12-31', precision: 'year', isEstimated: true })
  })

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
      for (const genauigkeit of ['monat', 'jahr'] as const) {
        const { bestBefore } = mapBestBeforeEstimateAnswer(
          answer({ haltbar_monate: months, genauigkeit }),
          today,
        )
        expect(bestBefore?.isEstimated).toBe(true)
        expect(bestBefore?.precision).not.toBe('day')
      }
    }
  })
})
