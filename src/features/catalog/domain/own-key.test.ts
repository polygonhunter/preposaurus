import { describe, expect, it } from 'vitest'
import { uniqueOwnKey } from './own-key'

describe('uniqueOwnKey', () => {
  it('bildet den Schlüssel aus dem Namen', () => {
    expect(uniqueOwnKey('Dinkel-Pops', new Set())).toBe('eigen_dinkel_pops')
  })

  it('zählt hoch, wenn der Schlüssel schon vergeben ist', () => {
    const taken = new Set(['eigen_pops', 'eigen_pops_2'])

    expect(uniqueOwnKey('Pops', taken)).toBe('eigen_pops_3')
  })

  it('nimmt einen Ersatz, wenn vom Namen nichts übrig bleibt', () => {
    expect(uniqueOwnKey('???', new Set())).toBe('eigen_art')
  })

  it('bleibt mit Zähler höchstens 60 Zeichen lang', () => {
    const name = 'x'.repeat(80)
    const first = uniqueOwnKey(name, new Set())

    const second = uniqueOwnKey(name, new Set([first]))

    expect(second).toHaveLength(60)
    expect(second.endsWith('_2')).toBe(true)
  })
})
