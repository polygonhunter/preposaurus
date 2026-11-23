import { describe, expect, it } from 'vitest'
import { calculateNextStep } from './next-step'

// TESTDATEN: 5.600 kcal und 6 l Wasser je Tag, Ziel 10 Tage
const need = { kcalPerDay: 5600, waterMlPerDay: 6000 }

describe('calculateNextStep', () => {
  it('nennt bei Wasser als Engpass die Liter bis zum Ziel und was beim Essen fehlt', () => {
    const step = calculateNextStep({
      today: { energyDays: 9.4, waterDays: 6, bottleneck: 'water' },
      goalDays: 10,
      need,
    })

    expect(step?.resource).toBe('water')
    expect(step?.missing).toBe(24_000)
    expect(step?.alsoMissing?.resource).toBe('energy')
    expect(step?.alsoMissing?.missing).toBeCloseTo(3360)
  })

  it('nennt bei Essen als Engpass die kcal bis zum Ziel', () => {
    const step = calculateNextStep({
      today: { energyDays: 3, waterDays: 12, bottleneck: 'energy' },
      goalDays: 10,
      need,
    })

    expect(step).toEqual({ resource: 'energy', missing: 39_200, alsoMissing: null })
  })

  it('braucht nur den Engpass, wenn der andere Wert über dem Ziel liegt', () => {
    const step = calculateNextStep({
      today: { energyDays: 14, waterDays: 2.5, bottleneck: 'water' },
      goalDays: 10,
      need,
    })

    expect(step).toEqual({ resource: 'water', missing: 45_000, alsoMissing: null })
  })

  it('gibt keinen Schritt, wenn das Ziel heute erreicht ist', () => {
    const step = calculateNextStep({
      today: { energyDays: 12, waterDays: 10, bottleneck: 'water' },
      goalDays: 10,
      need,
    })

    expect(step).toBeNull()
  })

  it('gibt ohne Bedarf keinen Schritt', () => {
    const step = calculateNextStep({
      today: { energyDays: 0, waterDays: 0, bottleneck: 'water' },
      goalDays: 10,
      need: { kcalPerDay: 0, waterMlPerDay: 0 },
    })

    expect(step).toBeNull()
  })
})
