import { describe, expect, it } from 'vitest'
import { amountPerUnit, kjToKcal, nutritionBase, resolveKcal, toPer100 } from './nutrition'

describe('kjToKcal und resolveKcal', () => {
  it('rechnet kJ durch 4,184 in kcal um', () => {
    expect(kjToKcal(4184)).toBe(1000)
    expect(kjToKcal(1500)).toBeCloseTo(358.5, 1)
  })

  it('nimmt kcal, wenn kcal und kJ dastehen', () => {
    expect(resolveKcal({ kcal: 359, kj: 1520 })).toBe(359)
  })

  it('rechnet um, wenn nur kJ dastehen', () => {
    expect(resolveKcal({ kcal: null, kj: 4184 })).toBe(1000)
  })

  it('akzeptiert 0 kcal, etwa bei Wasser', () => {
    expect(resolveKcal({ kcal: 0, kj: null })).toBe(0)
  })

  it('liefert null, wenn nichts Brauchbares dasteht', () => {
    expect(resolveKcal({ kcal: null, kj: null })).toBeNull()
    expect(resolveKcal({ kcal: -5, kj: null })).toBeNull()
    expect(resolveKcal({ kcal: Number.NaN, kj: -1 })).toBeNull()
  })

  it('nimmt kJ, wenn der kcal-Wert unbrauchbar ist', () => {
    expect(resolveKcal({ kcal: -5, kj: 4184 })).toBe(1000)
  })
})

describe('toPer100', () => {
  it('lässt Werte je 100 g oder 100 ml unverändert', () => {
    expect(toPer100({ value: 359, basis: '100g', portionSize: null })).toEqual({
      ok: true,
      value: 359,
    })
    expect(toPer100({ value: 42, basis: '100ml', portionSize: 250 })).toEqual({
      ok: true,
      value: 42,
    })
  })

  it('rechnet eine Portion mit bekannter Größe auf 100 um', () => {
    expect(toPer100({ value: 90, basis: 'portion', portionSize: 30 })).toEqual({
      ok: true,
      value: 300,
    })
  })

  it('verlangt bei einer Portion deren Größe', () => {
    const missing = { ok: false, error: { kind: 'portion-size-missing' } }
    expect(toPer100({ value: 90, basis: 'portion', portionSize: null })).toEqual(missing)
    expect(toPer100({ value: 90, basis: 'portion', portionSize: 0 })).toEqual(missing)
  })
})

describe('nutritionBase', () => {
  it('nimmt das Abtropfgewicht vor dem Inhalt', () => {
    expect(nutritionBase({ value: 400, unit: 'g' }, 240)).toBe(240)
  })

  it('nimmt den Inhalt, wenn kein Abtropfgewicht da ist', () => {
    expect(nutritionBase({ value: 400, unit: 'g' }, null)).toBe(400)
    expect(nutritionBase({ value: 400, unit: 'g' }, 0)).toBe(400)
  })

  it('kennt bei Stückware ohne Gewicht keine Bezugsmenge', () => {
    expect(nutritionBase({ value: 6, unit: 'piece' }, null)).toBeNull()
  })
})

describe('amountPerUnit', () => {
  it('rechnet kcal je Packung: 500 g × 359 kcal ÷ 100 = 1.795 kcal', () => {
    expect(
      amountPerUnit({ content: { value: 500, unit: 'g' }, drainedWeightG: null, per100: 359 }),
    ).toBe(1795)
  })

  it('rechnet bei Konserven mit dem Abtropfgewicht', () => {
    const content = { value: 400, unit: 'g' as const }
    expect(amountPerUnit({ content, drainedWeightG: 240, per100: 100 })).toBe(240)
  })

  it('rechnet Getränke in ml', () => {
    const content = { value: 1500, unit: 'ml' as const }
    expect(amountPerUnit({ content, drainedWeightG: null, per100: 42 })).toBe(630)
  })

  it('liefert null bei Stückware ohne Gewicht', () => {
    const content = { value: 6, unit: 'piece' as const }
    expect(amountPerUnit({ content, drainedWeightG: null, per100: 100 })).toBeNull()
  })
})
