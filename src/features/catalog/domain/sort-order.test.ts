import { describe, expect, it } from 'vitest'
import { moveInOrder } from './sort-order'

describe('moveInOrder', () => {
  it('tauscht einen Eintrag mit seinem Vorgänger', () => {
    expect(moveInOrder(['a', 'b', 'c'], 'c', 'up')).toEqual(['a', 'c', 'b'])
  })

  it('tauscht einen Eintrag mit seinem Nachfolger', () => {
    expect(moveInOrder(['a', 'b', 'c'], 'a', 'down')).toEqual(['b', 'a', 'c'])
  })

  it('liefert null am oberen und unteren Rand', () => {
    expect(moveInOrder(['a', 'b'], 'a', 'up')).toBeNull()
    expect(moveInOrder(['a', 'b'], 'b', 'down')).toBeNull()
  })

  it('liefert null für einen unbekannten Eintrag', () => {
    expect(moveInOrder(['a', 'b'], 'x', 'down')).toBeNull()
  })
})
