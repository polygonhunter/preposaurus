import { describe, expect, it } from 'vitest'
import { choosePassword, generateAllowedPassword } from './choose-password'

const context = { username: 'robin', displayName: 'Robin', householdName: 'Unser Haushalt' }

describe('Passwort wählen', () => {
  it('nimmt ein eingegebenes Passwort, das die Regeln erfüllt', () => {
    const result = choosePassword('Linse Regal Hafer', { ...context, generate: () => 'nie' })

    expect(result).toEqual({ ok: true, value: 'Linse Regal Hafer' })
  })

  it('zieht ein erzeugtes Passwort neu, wenn es zufällig einen Namen enthält', () => {
    const draws = ['abcd-robin-efgh', 'kmnp-qrst-uvwx']
    const result = choosePassword(null, { ...context, generate: () => draws.shift() ?? '' })

    expect(result).toEqual({ ok: true, value: 'kmnp-qrst-uvwx' })
  })

  it('gibt nach einigen Versuchen das letzte erzeugte zurück', () => {
    const result = choosePassword(null, { ...context, generate: () => 'robin-robin' })

    expect(result).toEqual({ ok: true, value: 'robin-robin' })
  })

  it('lehnt ein eingegebenes häufiges Passwort ab', () => {
    const result = choosePassword('Passwort1234', { ...context, generate: () => 'nie' })

    expect(result).toEqual({ ok: false, error: 'common-password' })
  })

  it('zieht für die Kommandozeile neu, wenn das erzeugte Passwort häufig ist', () => {
    const draws = ['1234567890', 'kmnp-qrst-uvwx']

    expect(
      generateAllowedPassword({ username: 'robin', generate: () => draws.shift() ?? '' }),
    ).toBe('kmnp-qrst-uvwx')
  })
})
