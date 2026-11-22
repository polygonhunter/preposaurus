import { describe, expect, it, vi } from 'vitest'
import { getCaptureOptions, type CaptureOptionsReader } from './get-capture-options'

const noodles = {
  id: 'nudeln',
  name: 'Nudeln',
  categoryName: 'Nudeln, Reis und Getreide',
  productGroupName: 'Getreide',
  kcalPer100: 358,
}

function fakeReader(change: Partial<CaptureOptionsReader> = {}): CaptureOptionsReader {
  return {
    loadFoodTypes: () => Promise.resolve([noodles]),
    loadContainers: () => Promise.resolve([{ id: 'dose', name: 'Dose' }]),
    loadStorageLocations: () => Promise.resolve([{ id: 'keller', name: 'Keller' }]),
    loadLastUsed: () =>
      Promise.resolve({ storageLocationId: 'keller', foodTypeIds: ['nudeln', 'weg'] }),
    hasStock: () => Promise.resolve(true),
    ...change,
  }
}

describe('getCaptureOptions', () => {
  it('liefert Auswahllisten mit Vorbelegung aus der letzten Erfassung', async () => {
    const options = await getCaptureOptions(fakeReader(), { householdId: 'h', userId: 'u' })

    expect(options).toEqual({
      foodTypes: [noodles],
      containers: [{ id: 'dose', name: 'Dose' }],
      storageLocations: [{ id: 'keller', name: 'Keller' }],
      lastStorageLocationId: 'keller',
      recentFoodTypeIds: ['nudeln'],
      isStockEmpty: false,
    })
  })

  it('fragt mit Haushalt und Nutzer und meldet den leeren Vorrat', async () => {
    const loadLastUsed = vi.fn(() => Promise.resolve({ storageLocationId: null, foodTypeIds: [] }))
    const loadStorageLocations = vi.fn(() => Promise.resolve([]))
    const options = await getCaptureOptions(
      fakeReader({ loadLastUsed, loadStorageLocations, hasStock: () => Promise.resolve(false) }),
      { householdId: 'haushalt', userId: 'nutzer' },
    )

    expect(loadLastUsed).toHaveBeenCalledWith('haushalt', 'nutzer')
    expect(loadStorageLocations).toHaveBeenCalledWith('haushalt')
    expect(options.isStockEmpty).toBe(true)
    expect(options.lastStorageLocationId).toBeNull()
  })
})
