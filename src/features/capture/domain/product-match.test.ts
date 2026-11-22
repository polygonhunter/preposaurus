import { describe, expect, it } from 'vitest'
import { isSameProduct, type ProductIdentity } from './product-match'

const spaghetti: ProductIdentity = {
  foodTypeId: 'nudeln',
  content: { value: 500, unit: 'g' },
  containerId: 'packung',
}

describe('isSameProduct', () => {
  it('erkennt gleiche Lebensmittelart, Menge und Behälter', () => {
    expect(isSameProduct({ ...spaghetti }, spaghetti)).toBe(true)
  })

  it('übersieht Rundung aus der DB', () => {
    expect(isSameProduct({ ...spaghetti, content: { value: 500.001, unit: 'g' } }, spaghetti)).toBe(
      true,
    )
  })

  it('trennt andere Menge, andere Einheit und anderen Behälter', () => {
    expect(isSameProduct({ ...spaghetti, content: { value: 1000, unit: 'g' } }, spaghetti)).toBe(
      false,
    )
    expect(isSameProduct({ ...spaghetti, content: { value: 500, unit: 'ml' } }, spaghetti)).toBe(
      false,
    )
    expect(isSameProduct({ ...spaghetti, containerId: 'glas' }, spaghetti)).toBe(false)
    expect(isSameProduct({ ...spaghetti, containerId: null }, spaghetti)).toBe(false)
  })

  it('behandelt „kein Behälter“ auf beiden Seiten als gleich', () => {
    const loose = { ...spaghetti, containerId: null }
    expect(isSameProduct({ ...loose }, loose)).toBe(true)
  })

  it('erkennt ohne Lebensmittelart nie ein Produkt wieder', () => {
    const unknown = { ...spaghetti, foodTypeId: null }
    expect(isSameProduct({ ...unknown }, unknown)).toBe(false)
  })
})
