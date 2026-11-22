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

describe('isApproximate mit echten Anteilen', () => {
  it('setzt „ca.“ bei genau 10 %, auch wenn die Division 0,0999… ergibt', () => {
    const share = estimatedKcalShare([
      { kcal: 6.3, isKcalEstimated: false },
      { kcal: 0.7, isKcalEstimated: true },
    ])
    expect(share).toBeLessThan(0.1)
    expect(isApproximate(share)).toBe(true)
  })

  it('setzt kein „ca.“ knapp unter 10 %', () => {
    const share = estimatedKcalShare([
      { kcal: 901, isKcalEstimated: false },
      { kcal: 99, isKcalEstimated: true },
    ])
    expect(isApproximate(share)).toBe(false)
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
