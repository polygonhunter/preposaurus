import { describe, expect, it } from 'vitest'
import { listNames } from './german-list'

describe('listNames', () => {
  it('liefert nichts ohne Namen und einen Namen allein', () => {
    expect(listNames([], 3)).toBe('')
    expect(listNames(['Reis'], 3)).toBe('Reis')
  })

  it('verbindet bis zur Obergrenze mit Komma und „und“', () => {
    expect(listNames(['Reis', 'Mehl'], 3)).toBe('Reis und Mehl')
    expect(listNames(['Reis', 'Mehl', 'Linsen'], 3)).toBe('Reis, Mehl und Linsen')
  })

  it('nennt jeden Namen nur einmal und behält die Reihenfolge', () => {
    expect(listNames(['Reis', 'Mehl', 'Reis'], 3)).toBe('Reis und Mehl')
  })

  it('fasst über der Obergrenze zusammen', () => {
    expect(listNames(['a', 'b', 'c', 'd', 'e', 'f', 'g'], 5)).toBe('a, b, c, d, e und 2 weitere')
    expect(listNames(['a', 'b', 'c', 'd'], 3)).toBe('a, b, c und 1 weitere')
  })
})
