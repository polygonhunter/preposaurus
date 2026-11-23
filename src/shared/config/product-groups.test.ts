import { describe, expect, it } from 'vitest'
import { productGroupShortName } from './product-groups'

describe('productGroupShortName', () => {
  it('kürzt den amtlichen Namen der Getreide-Gruppe', () => {
    expect(
      productGroupShortName('getreide', 'Getreide, Getreideprodukte, Brot und Kartoffeln'),
    ).toBe('Getreide und Kartoffeln')
  })

  it('behält den amtlichen Namen, wenn es keinen Kurznamen gibt', () => {
    expect(productGroupShortName('wasser', 'Wasser')).toBe('Wasser')
  })
})
