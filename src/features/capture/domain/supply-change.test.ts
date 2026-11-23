import { describe, expect, it } from 'vitest'
import { compareSupplyDays } from './supply-change'

const days = (energyDays: number, waterDays: number) => ({ energyDays, waterDays })

describe('compareSupplyDays', () => {
  it('nennt Essen, wenn sich die ganzen Tage ändern', () => {
    expect(compareSupplyDays(days(9.4, 3), days(11.3, 3))).toEqual({
      resource: 'energy',
      before: 9.4,
      after: 11.3,
    })
  })

  it('nennt Wasser, wenn sich nur dort die ganzen Tage ändern', () => {
    expect(compareSupplyDays(days(9.4, 2.8), days(9.4, 4.1))).toEqual({
      resource: 'water',
      before: 2.8,
      after: 4.1,
    })
  })

  it('bleibt still, wenn sich nur die Nachkommastelle ändert', () => {
    expect(compareSupplyDays(days(9.1, 3), days(9.9, 3.5))).toBeNull()
  })

  it('zählt den Schritt über eine ganze Zahl, auch von 0 aus', () => {
    expect(compareSupplyDays(days(0, 0), days(1, 0))).toMatchObject({ before: 0, after: 1 })
  })

  it('nimmt Essen vor Wasser, wenn sich beides ändert', () => {
    expect(compareSupplyDays(days(1, 1), days(2, 2))?.resource).toBe('energy')
  })
})
