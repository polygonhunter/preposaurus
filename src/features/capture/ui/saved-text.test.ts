import { describe, expect, it } from 'vitest'
import { supplyChangeText } from './saved-text'

describe('supplyChangeText', () => {
  it('sagt, wie lange das Essen jetzt reicht und wie lange vorher', () => {
    expect(supplyChangeText({ resource: 'energy', before: 9.4, after: 11.3 })).toBe(
      'Euer Essen reicht jetzt 11,3 statt 9,4 Tage.',
    )
  })

  it('spricht beim Wasser vom Wasser', () => {
    expect(supplyChangeText({ resource: 'water', before: 2, after: 4 })).toBe(
      'Euer Wasser reicht jetzt 4 statt 2 Tage.',
    )
  })

  it('nennt ohne Vorher nur den neuen Stand', () => {
    expect(supplyChangeText({ resource: 'energy', before: 0, after: 2.1 })).toBe(
      'Euer Essen reicht jetzt für 2,1 Tage.',
    )
    expect(supplyChangeText({ resource: 'energy', before: 0, after: 1 })).toBe(
      'Euer Essen reicht jetzt für 1 Tag.',
    )
  })

  it('sagt „1 Tag“ in der Einzahl', () => {
    expect(supplyChangeText({ resource: 'water', before: 0.6, after: 1 })).toBe(
      'Euer Wasser reicht jetzt 1 Tag statt 0,6 Tage.',
    )
  })

  it('kommt ohne Ausrufezeichen aus', () => {
    expect(supplyChangeText({ resource: 'energy', before: 3, after: 5 })).not.toContain('!')
  })
})
