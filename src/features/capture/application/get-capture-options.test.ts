import { describe, expect, it, vi } from 'vitest'
import { getCaptureOptions, type CaptureOptionsReader } from './get-capture-options'

const noodles = {
  id: 'nudeln',
  key: 'nudeln',
  name: 'Nudeln',
  categoryName: 'Nudeln, Reis und Getreide',
  productGroupName: 'Getreide',
  kcalPer100: 358,
  searchTerms: [],
}

const knownNoodles = {
  id: 'produkt',
  name: 'Nudeln',
  foodTypeId: 'nudeln',
  content: { value: 500, unit: 'g' as const },
  containerId: null,
  containerName: null,
  storageLocationName: 'Keller',
}

const CEREALS = { id: 'kat', name: 'Nudeln, Reis und Getreide', productGroupName: 'Getreide' }

function fakeReader(change: Partial<CaptureOptionsReader> = {}): CaptureOptionsReader {
  return {
    loadFoodTypes: () => Promise.resolve([noodles]),
    loadContainers: () => Promise.resolve([{ id: 'dose', key: 'dose', name: 'Dose' }]),
    loadStorageLocations: () => Promise.resolve([{ id: 'keller', name: 'Keller' }]),
    loadKnownProducts: () => Promise.resolve([knownNoodles]),
    loadLastUsed: () =>
      Promise.resolve({ storageLocationId: 'keller', foodTypeIds: ['nudeln', 'weg'] }),
    hasStock: () => Promise.resolve(true),
    loadCategories: () => Promise.resolve([CEREALS]),
    ...change,
  }
}

describe('getCaptureOptions', () => {
  it('liefert Auswahllisten mit Vorbelegung aus der letzten Erfassung', async () => {
    const options = await getCaptureOptions(fakeReader(), { householdId: 'h', userId: 'u' })

    expect(options).toEqual({
      foodTypes: [noodles],
      containers: [{ id: 'dose', key: 'dose', name: 'Dose' }],
      storageLocations: [{ id: 'keller', name: 'Keller' }],
      knownProducts: [knownNoodles],
      lastStorageLocationId: 'keller',
      recentFoodTypeIds: ['nudeln'],
      isStockEmpty: false,
      categories: [CEREALS],
    })
  })

  it('fragt mit Haushalt und Nutzer und meldet den leeren Vorrat', async () => {
    const loadLastUsed = vi.fn(() => Promise.resolve({ storageLocationId: null, foodTypeIds: [] }))
    const loadStorageLocations = vi.fn(() => Promise.resolve([]))
    const loadKnownProducts = vi.fn(() => Promise.resolve([]))
    const options = await getCaptureOptions(
      fakeReader({
        loadLastUsed,
        loadStorageLocations,
        loadKnownProducts,
        hasStock: () => Promise.resolve(false),
      }),
      { householdId: 'haushalt', userId: 'nutzer' },
    )

    expect(loadLastUsed).toHaveBeenCalledWith('haushalt', 'nutzer')
    expect(loadStorageLocations).toHaveBeenCalledWith('haushalt')
    expect(loadKnownProducts).toHaveBeenCalledWith('haushalt')
    expect(options.isStockEmpty).toBe(true)
    expect(options.lastStorageLocationId).toBeNull()
  })
})
