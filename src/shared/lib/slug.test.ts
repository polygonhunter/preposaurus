import { describe, expect, it } from 'vitest'
import { OWN_KEY_PREFIX, toOwnKey } from './slug'

describe('toOwnKey', () => {
  it('macht aus einem Namen einen Schlüssel mit Präfix', () => {
    expect(toOwnKey('Dinkel-Nudeln (Vollkorn)')).toBe('eigen_dinkel_nudeln_vollkorn')
  })

  it('schreibt Umlaute und ß aus und entfernt Akzente', () => {
    expect(toOwnKey('Grüne Soße mit Crème')).toBe('eigen_gruene_sosse_mit_creme')
  })

  it('liefert null, wenn nichts Verwertbares übrig bleibt', () => {
    expect(toOwnKey(' – !? ')).toBeNull()
  })

  it('kürzt auf 60 Zeichen ohne Unterstrich am Ende', () => {
    const key = toOwnKey(`${'a'.repeat(53)} bc`)

    expect(key).toHaveLength(60 - 1)
    expect(key?.startsWith(OWN_KEY_PREFIX)).toBe(true)
    expect(key?.endsWith('_')).toBe(false)
  })
})
