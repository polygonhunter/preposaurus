import { describe, expect, it } from 'vitest'
import {
  findProductMatches,
  fitsWish,
  MAX_OFFERS_WITHOUT_CONTENT,
  soleMatch,
  type ProductIdentity,
  type ProductWish,
} from './product-match'

const spaghetti: ProductIdentity = {
  foodTypeId: 'nudeln',
  content: { value: 500, unit: 'g' },
  containerId: 'packung',
}

const wish = (overrides: Partial<ProductWish> = {}): ProductWish => ({
  foodTypeId: 'nudeln',
  content: { value: 500, unit: 'g' },
  containerId: 'packung',
  ...overrides,
})

describe('fitsWish', () => {
  it('erkennt gleiche Lebensmittelart, Menge und Behälter', () => {
    expect(fitsWish(spaghetti, wish())).toBe(true)
  })

  it('übersieht Rundung aus der DB', () => {
    expect(fitsWish({ ...spaghetti, content: { value: 500.001, unit: 'g' } }, wish())).toBe(true)
  })

  it('trennt andere Art, andere Menge, andere Einheit und anderen Behälter', () => {
    expect(fitsWish(spaghetti, wish({ foodTypeId: 'reis' }))).toBe(false)
    expect(fitsWish(spaghetti, wish({ content: { value: 1000, unit: 'g' } }))).toBe(false)
    expect(fitsWish(spaghetti, wish({ content: { value: 500, unit: 'ml' } }))).toBe(false)
    expect(fitsWish(spaghetti, wish({ containerId: 'glas' }))).toBe(false)
  })

  it('schließt ohne Behälter auf einer Seite nichts aus (#207)', () => {
    expect(fitsWish(spaghetti, wish({ containerId: null }))).toBe(true)
    expect(fitsWish({ ...spaghetti, containerId: null }, wish())).toBe(true)
  })

  it('passt ohne Inhalt zu jedem Produkt der Art', () => {
    expect(fitsWish(spaghetti, wish({ content: null, containerId: null }))).toBe(true)
  })

  it('erkennt ohne Lebensmittelart nie ein Produkt wieder', () => {
    expect(fitsWish({ ...spaghetti, foodTypeId: null }, wish({ foodTypeId: null }))).toBe(false)
  })
})

describe('findProductMatches', () => {
  const product = (id: string, overrides: Partial<ProductIdentity> = {}) => ({
    id,
    ...spaghetti,
    ...overrides,
  })

  it('bietet schon nach der Art an, solange es wenige Produkte gibt', () => {
    const candidates = [product('a'), product('b', { content: { value: 1000, unit: 'g' } })]

    const found = findProductMatches(candidates, wish({ content: null, containerId: null }))

    expect(found.map((match) => match.id)).toEqual(['a', 'b'])
  })

  it('wartet bei vielen Produkten der Art auf den Inhalt', () => {
    const many = Array.from({ length: MAX_OFFERS_WITHOUT_CONTENT + 1 }, (_, index) =>
      product(String(index), { content: { value: 100 * (index + 1), unit: 'g' } }),
    )

    expect(findProductMatches(many, wish({ content: null }))).toEqual([])
    expect(findProductMatches(many, wish({ content: { value: 200, unit: 'g' } }))).toHaveLength(1)
  })

  it('liefert dasselbe Produkt an zwei Lagerorten zweimal', () => {
    const found = findProductMatches([product('keller'), product('kueche')], wish())

    expect(found.map((match) => match.id)).toEqual(['keller', 'kueche'])
  })
})

describe('soleMatch', () => {
  it('wählt genau ein passendes Produkt vor', () => {
    expect(soleMatch([{ id: 'a' }], [])).toEqual({ id: 'a' })
  })

  it('wählt nichts bei keinem oder mehreren Produkten', () => {
    expect(soleMatch([], [])).toBeNull()
    expect(soleMatch([{ id: 'a' }, { id: 'b' }], [])).toBeNull()
  })

  it('wählt ein abgewähltes Produkt nicht erneut', () => {
    expect(soleMatch([{ id: 'a' }], ['a'])).toBeNull()
  })
})
