import { describe, expect, it } from 'vitest'
import { err, ok, type Result } from './result'

const parseQuantity = (input: string): Result<number, 'not-a-number'> => {
  const value = Number(input)
  return Number.isNaN(value) ? err('not-a-number') : ok(value)
}

describe('Result', () => {
  it('liefert bei Erfolg ok = true und den Wert', () => {
    expect(parseQuantity('3')).toEqual({ ok: true, value: 3 })
  })

  it('liefert bei einem erwarteten Fehler ok = false und den Fehler', () => {
    expect(parseQuantity('drei')).toEqual({ ok: false, error: 'not-a-number' })
  })

  it('grenzt den Typ über ok ein', () => {
    const result = parseQuantity('5')

    const doubled = result.ok ? result.value * 2 : 0

    expect(doubled).toBe(10)
  })
})
