import { describe, expect, it } from 'vitest'
import { toChartPoints, toPercent, toPolylinePoints } from './scale'

describe('toPercent', () => {
  it('rechnet einen Wert in Prozent der Skala um', () => {
    expect(toPercent(5, 20)).toBe(25)
  })

  it('begrenzt auf 0 bis 100 Prozent', () => {
    expect(toPercent(30, 20)).toBe(100)
    expect(toPercent(-3, 20)).toBe(0)
  })

  it('liefert 0 bei leerer oder ungültiger Skala', () => {
    expect(toPercent(5, 0)).toBe(0)
    expect(toPercent(Number.NaN, 10)).toBe(0)
    expect(toPercent(5, Number.POSITIVE_INFINITY)).toBe(0)
  })
})

describe('toChartPoints', () => {
  const box = { width: 100, height: 50, padding: 5 }

  it('verteilt die Werte über die Breite, den größten oben', () => {
    expect(toChartPoints([0, 10, 5], box)).toEqual([
      { x: 5, y: 45 },
      { x: 50, y: 5 },
      { x: 95, y: 25 },
    ])
  })

  it('legt gleiche Werte in die Mitte', () => {
    expect(toChartPoints([3, 3], box).map(({ y }) => y)).toEqual([25, 25])
  })

  it('setzt einen einzelnen Wert an den linken Rand', () => {
    expect(toChartPoints([7], box)).toEqual([{ x: 5, y: 25 }])
  })
})

describe('toPolylinePoints', () => {
  it('schreibt die Punkte für das SVG-Attribut points', () => {
    expect(
      toPolylinePoints([
        { x: 1, y: 2.25 },
        { x: 3, y: 4 },
      ]),
    ).toBe('1.0,2.3 3.0,4.0')
  })
})
