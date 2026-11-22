import { describe, expect, it } from 'vitest'
import { applyLastUsed, foodTypePath } from './capture-options'

const choices = {
  foodTypes: [
    { id: 'nudeln', name: 'Nudeln' },
    { id: 'reis', name: 'Reis' },
  ],
  storageLocations: [{ id: 'keller', name: 'Keller' }],
}

describe('applyLastUsed', () => {
  it('belegt mit dem letzten Lagerort und den zuletzt genutzten Arten vor', () => {
    expect(
      applyLastUsed({ storageLocationId: 'keller', foodTypeIds: ['reis', 'nudeln'] }, choices),
    ).toEqual({
      lastStorageLocationId: 'keller',
      recentFoodTypeIds: ['reis', 'nudeln'],
    })
  })

  it('übergeht inzwischen ausgeblendete Lagerorte und Arten', () => {
    expect(
      applyLastUsed({ storageLocationId: 'dachboden', foodTypeIds: ['mehl', 'reis'] }, choices),
    ).toEqual({
      lastStorageLocationId: null,
      recentFoodTypeIds: ['reis'],
    })
  })

  it('bleibt ohne frühere Erfassung leer', () => {
    expect(applyLastUsed({ storageLocationId: null, foodTypeIds: [] }, choices)).toEqual({
      lastStorageLocationId: null,
      recentFoodTypeIds: [],
    })
  })
})

describe('foodTypePath', () => {
  it('zeigt Warengruppe › Kategorie', () => {
    expect(foodTypePath({ productGroupName: 'Getreide', categoryName: 'Nudeln' })).toBe(
      'Getreide › Nudeln',
    )
  })
})
