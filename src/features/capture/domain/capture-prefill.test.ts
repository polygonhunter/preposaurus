import { describe, expect, it } from 'vitest'
import type { FoodTypeChoice, KnownProduct } from './capture-options'
import { resolvePrefill } from './capture-prefill'

const foodType = (id: string): FoodTypeChoice => ({
  id,
  key: id,
  name: id,
  categoryName: 'Kategorie',
  productGroupName: 'Warengruppe',
  kcalPer100: null,
  searchTerms: [],
})

const product = (id: string, foodTypeId: string | null): KnownProduct => ({
  id,
  name: id,
  foodTypeId,
  content: { value: 500, unit: 'g' },
  containerId: null,
  containerName: null,
  storageLocationName: null,
})

const choices = {
  foodTypes: [foodType('nudeln'), foodType('reis')],
  knownProducts: [
    product('spaghetti', 'nudeln'),
    product('reis-1', 'reis'),
    product('reis-2', 'reis'),
    product('ohne-art', null),
  ],
}

describe('resolvePrefill', () => {
  it('wählt ein Produkt samt seiner Art als Nachschub', () => {
    expect(resolvePrefill(choices, { productId: 'spaghetti' })).toEqual({
      foodTypeId: 'nudeln',
      product: choices.knownProducts[0],
    })
  })

  it('wählt bei einer Art mit genau einem Produkt dieses vor', () => {
    expect(resolvePrefill(choices, { foodTypeId: 'nudeln' })?.product?.id).toBe('spaghetti')
  })

  it('wählt bei mehreren Produkten nur die Art', () => {
    expect(resolvePrefill(choices, { foodTypeId: 'reis' })).toEqual({
      foodTypeId: 'reis',
      product: null,
    })
  })

  it('nimmt das Produkt vor der Art', () => {
    expect(
      resolvePrefill(choices, { foodTypeId: 'reis', productId: 'spaghetti' })?.foodTypeId,
    ).toBe('nudeln')
  })

  it('fällt bei unbekanntem Produkt auf die Art zurück', () => {
    expect(resolvePrefill(choices, { foodTypeId: 'reis', productId: 'fremd' })?.foodTypeId).toBe(
      'reis',
    )
  })

  it('belegt nichts vor, was nicht in der Auswahl des Haushalts steht', () => {
    expect(resolvePrefill(choices, { foodTypeId: 'fremd' })).toBeNull()
    expect(resolvePrefill(choices, { productId: 'ohne-art' })).toBeNull()
    expect(resolvePrefill(choices, {})).toBeNull()
    const hidden = { ...choices, foodTypes: [foodType('reis')] }
    expect(resolvePrefill(hidden, { productId: 'spaghetti' })).toBeNull()
  })
})
