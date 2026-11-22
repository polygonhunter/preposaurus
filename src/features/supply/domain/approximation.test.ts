import { describe, expect, it } from 'vitest'
import { estimatedKcalShare, isApproximate } from './approximation'

describe('estimatedKcalShare', () => {
  it('teilt die kcal aus Richtwerten durch alle kcal', () => {
    const units = [
      { kcal: 900, isKcalEstimated: false },
      { kcal: 100, isKcalEstimated: true },
    ]
    expect(estimatedKcalShare(units)).toBe(0.1)
  })

  it('liefert 0 ohne Einheiten oder ohne kcal, auch wenn Richtwerte dabei sind', () => {
    expect(estimatedKcalShare([])).toBe(0)
    expect(estimatedKcalShare([{ kcal: 0, isKcalEstimated: true }])).toBe(0)
  })

  it('liefert 1, wenn alle kcal aus Richtwerten stammen', () => {
    expect(estimatedKcalShare([{ kcal: 500, isKcalEstimated: true }])).toBe(1)
  })
})

describe('isApproximate', () => {
  it.each([
    [0, false],
    [0.0999, false],
    [0.1, true],
    [0.5, true],
    [1, true],
  ])('Anteil %d ergibt „ca.“ = %s', (share, expected) => {
    expect(isApproximate(share)).toBe(expected)
  })
})
