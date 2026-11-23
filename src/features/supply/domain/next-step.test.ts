import { describe, expect, it } from 'vitest'
import { calculateNextStep } from './next-step'

// TESTDATEN: 5.600 kcal und 6 l Wasser je Tag, Ziel 10 Tage
const need = { kcalPerDay: 5600, waterMlPerDay: 6000 }

describe('calculateNextStep', () => {
  it('nennt bei Wasser als Engpass die Liter bis zum Ziel und was beim Essen fehlt', () => {
    const step = calculateNextStep({
      today: { kcal: 52_640, waterMl: 36_000, bottleneck: 'water' },
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
      today: { kcal: 16_800, waterMl: 72_000, bottleneck: 'energy' },
      goalDays: 10,
      need,
    })

    expect(step).toEqual({ resource: 'energy', missing: 39_200, alsoMissing: null })
  })

  it('braucht nur den Engpass, wenn der andere Wert über dem Ziel liegt', () => {
    const step = calculateNextStep({
      today: { kcal: 78_400, waterMl: 15_000, bottleneck: 'water' },
      goalDays: 10,
      need,
    })

    expect(step).toEqual({ resource: 'water', missing: 45_000, alsoMissing: null })
  })

  // Fall aus #214: 5,5 l und 6.000 kcal je Tag, 18 l und 31.965 kcal im Vorrat. Aus abgerundeten
  // Tagen (3,2 und 5,3) kämen 37,4 l und 28.200 kcal heraus.
  it('rechnet mit dem ungerundeten Bestand, nicht mit abgerundeten Tagen', () => {
    const step = calculateNextStep({
      today: { kcal: 31_965, waterMl: 18_000, bottleneck: 'water' },
      goalDays: 10,
      need: { kcalPerDay: 6000, waterMlPerDay: 5500 },
    })

    expect(step).toEqual({
      resource: 'water',
      missing: 37_000,
      alsoMissing: { resource: 'energy', missing: 28_035 },
    })
  })

  it('gibt keinen Schritt, wenn das Ziel heute erreicht ist', () => {
    const step = calculateNextStep({
      today: { kcal: 67_200, waterMl: 60_000, bottleneck: 'water' },
      goalDays: 10,
      need,
    })

    expect(step).toBeNull()
  })

  it('gibt ohne Bedarf keinen Schritt', () => {
    const step = calculateNextStep({
      today: { kcal: 0, waterMl: 0, bottleneck: 'water' },
      goalDays: 10,
      need: { kcalPerDay: 0, waterMlPerDay: 0 },
    })

    expect(step).toBeNull()
  })
})
