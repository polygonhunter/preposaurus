import { describe, expect, it } from 'vitest'
import { estimatedSharePercentText, isApproximate } from './approximation'

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

describe('estimatedSharePercentText', () => {
  it('rundet auf ganze Prozent', () => {
    expect(estimatedSharePercentText(0.123)).toBe('etwa 12 %')
  })

  it('nennt sehr kleine Anteile „weniger als 1 %“', () => {
    expect(estimatedSharePercentText(0.004)).toBe('weniger als 1 %')
  })

  it('zeigt knapp unter der Schwelle nie die Schwelle selbst', () => {
    expect(estimatedSharePercentText(0.097)).toBe('etwa 9 %')
  })

  it('zeigt bei genau 10 % auch 10 %', () => {
    expect(estimatedSharePercentText(0.7 / 7)).toBe('etwa 10 %')
  })
})
