import { describe, expect, expectTypeOf, it } from 'vitest'
import {
  formatGermanNumber,
  formatQuantity,
  parseContentQuantity,
  parseGermanNumber,
  parseQuantity,
  type ContentQuantity,
  type ContentParseError,
  type ContentUnit,
  type Quantity,
  type QuantityParseError,
} from './quantities'

describe('parseQuantity – gültige Mengen', () => {
  it.each([
    ['500 g', 500, 'g'],
    ['500g', 500, 'g'],
    ['500 G', 500, 'g'],
    ['250 gr.', 250, 'g'],
    ['1 kg', 1000, 'g'],
    ['1,5 kg', 1500, 'g'],
    ['0,25 kg', 250, 'g'],
    ['1.000 g', 1000, 'g'],
    ['2.500,5 g', 2500.5, 'g'],
    ['1,5 l', 1500, 'ml'],
    ['1.5 l', 1500, 'ml'],
    ['0,33 l', 330, 'ml'],
    ['0,7 Liter', 700, 'ml'],
    ['330 ml', 330, 'ml'],
    ['75 cl', 750, 'ml'],
    ['6 Stück', 6, 'piece'],
    ['6 Stk.', 6, 'piece'],
    ['1 St.', 1, 'piece'],
    ['  2 kg  ', 2000, 'g'],
  ])('%s ergibt %d %s', (text, value, unit) => {
    expect(parseQuantity(text)).toEqual({ ok: true, value: { value, unit } })
  })

  it('rechnet ohne Gleitkomma-Rauschen', () => {
    const result = parseQuantity('0,1 l')
    expect(result.ok && result.value.value).toBe(100)
  })
})

describe('parseQuantity – Fehler', () => {
  it.each<[string, QuantityParseError['kind']]>([
    ['', 'empty'],
    ['   ', 'empty'],
    ['0 g', 'not-positive'],
    ['0,0 l', 'not-positive'],
    ['-500 g', 'not-positive'],
    ['500', 'unknown-unit'],
    ['500 Dosen', 'unknown-unit'],
    ['3 oz', 'unknown-unit'],
    ['1,5 Stück', 'fractional-pieces'],
    ['g', 'invalid-number'],
    ['viel', 'invalid-number'],
    ['1,5,5 l', 'invalid-number'],
    ['1..5 l', 'invalid-number'],
    ['500 g Nudeln', 'invalid-number'],
  ])('%j ergibt den Fehler %s', (text, kind) => {
    expect(parseQuantity(text)).toEqual({ ok: false, error: { kind } })
  })
})

describe('parseContentQuantity – Inhalt einer Packung', () => {
  it.each([
    ['500 g', 500, 'g'],
    ['1,5 l', 1500, 'ml'],
  ])('%s ergibt %d %s', (text, value, unit) => {
    expect(parseContentQuantity(text)).toEqual({ ok: true, value: { value, unit } })
  })

  it.each<[string, ContentParseError['kind']]>([
    ['6 Stück', 'piece-not-content'],
    ['1 St.', 'piece-not-content'],
    ['1,5 Stück', 'piece-not-content'],
    ['0 Stück', 'piece-not-content'],
    ['-2 Stk.', 'piece-not-content'],
    ['0 g', 'not-positive'],
    ['500', 'unknown-unit'],
    ['', 'empty'],
  ])('%j ergibt den Fehler %s', (text, kind) => {
    expect(parseContentQuantity(text)).toEqual({ ok: false, error: { kind } })
  })
})

describe('parseGermanNumber', () => {
  it.each([
    ['1,5', 1.5],
    ['1.000', 1000],
    ['1.234.567,8', 1234567.8],
    ['12', 12],
    ['-3,5', -3.5],
  ])('%s ergibt %d', (text, value) => {
    expect(parseGermanNumber(text)).toBe(value)
  })

  it('lehnt Unlesbares ab', () => {
    expect(parseGermanNumber('1,2.3')).toBeNull()
    expect(parseGermanNumber('')).toBeNull()
  })
})

describe('formatGermanNumber', () => {
  it('nutzt Punkt als Tausendertrenner und Komma als Dezimalzeichen', () => {
    expect(formatGermanNumber(17950)).toBe('17.950')
    expect(formatGermanNumber(1795)).toBe('1.795')
    expect(formatGermanNumber(6.25)).toBe('6,3')
    expect(formatGermanNumber(6.25, 2)).toBe('6,25')
    expect(formatGermanNumber(0)).toBe('0')
  })
})

describe('ContentUnit', () => {
  it('kennt für Lebensmittel nur g und ml, Stück bleibt dem Nachkaufen vorbehalten', () => {
    expectTypeOf<ContentUnit>().toEqualTypeOf<'g' | 'ml'>()
    expectTypeOf<ContentQuantity>().toExtend<Quantity>()
  })
})

describe('formatQuantity', () => {
  it.each([
    [{ value: 500, unit: 'g' as const }, '500 g'],
    [{ value: 5000, unit: 'g' as const }, '5 kg'],
    [{ value: 1500, unit: 'g' as const }, '1,5 kg'],
    [{ value: 1250, unit: 'ml' as const }, '1,25 l'],
    [{ value: 330, unit: 'ml' as const }, '330 ml'],
    [{ value: 26000, unit: 'ml' as const }, '26 l'],
    [{ value: 6, unit: 'piece' as const }, '6 Stück'],
    [{ value: 1200, unit: 'piece' as const }, '1.200 Stück'],
    [{ value: -400, unit: 'g' as const }, '-400 g'],
  ])('%o ergibt %s', (quantity, text) => {
    expect(formatQuantity(quantity)).toBe(text)
  })
})
