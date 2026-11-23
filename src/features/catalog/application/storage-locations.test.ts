import { describe, expect, it } from 'vitest'
import type { StorageLocationRepository } from '../data/storage-location-repository'
import type { StorageLocation } from '../domain/storage-location'
import {
  addStorageLocation,
  moveStorageLocation,
  removeStorageLocation,
  renameStorageLocation,
} from './storage-locations'

const HOUSEHOLD = 'haushalt-1'

const location = (id: string, name: string, extra: Partial<StorageLocation> = {}) => ({
  id,
  name,
  isHidden: false,
  productCount: 0,
  ...extra,
})

function fakeRepository(initial: StorageLocation[]) {
  let locations = [...initial]
  const savedOrders: string[][] = []
  const repository: StorageLocationRepository = {
    list: () => Promise.resolve(locations),
    create: (_household, name) => {
      locations = [...locations, location(`neu-${name}`, name)]
      return Promise.resolve(`neu-${name}`)
    },
    rename: (_household, id, name) => {
      const found = locations.some((entry) => entry.id === id)
      locations = locations.map((entry) => (entry.id === id ? { ...entry, name } : entry))
      return Promise.resolve(found)
    },
    setHidden: () => Promise.resolve(true),
    remove: (_household, id) => {
      const found = locations.find((entry) => entry.id === id)
      if (found === undefined) return Promise.resolve('not-found')
      return Promise.resolve(found.productCount > 0 ? 'in-use' : 'removed')
    },
    saveOrder: (_household, ids) => {
      savedOrders.push([...ids])
      return Promise.resolve()
    },
  }
  return { deps: { storageLocations: repository }, savedOrders }
}

describe('Lagerorte verwalten', () => {
  it('legt einen neuen Ort an', async () => {
    const { deps } = fakeRepository([location('1', 'Keller')])

    const result = await addStorageLocation(deps, { householdId: HOUSEHOLD, name: 'Garage' })

    expect(result).toEqual({ ok: true, value: { id: 'neu-Garage' } })
  })

  it('lehnt einen schon vergebenen Namen ab und sagt, ob der Ort ausgeblendet ist', async () => {
    const { deps } = fakeRepository([location('1', 'Garage', { isHidden: true })])

    const result = await addStorageLocation(deps, { householdId: HOUSEHOLD, name: 'garage' })

    expect(result).toEqual({ ok: false, error: { kind: 'duplicate', isHidden: true } })
  })

  it('meldet einen doppelten Namen, wenn die DB das Anlegen ablehnt', async () => {
    const { deps } = fakeRepository([])
    deps.storageLocations.create = () => Promise.resolve(null)

    const result = await addStorageLocation(deps, { householdId: HOUSEHOLD, name: 'Keller' })

    expect(result).toEqual({ ok: false, error: { kind: 'duplicate', isHidden: false } })
  })

  it('benennt um, auch nur in anderer Schreibweise', async () => {
    const { deps } = fakeRepository([location('1', 'keller'), location('2', 'Küche')])

    const result = await renameStorageLocation(deps, {
      householdId: HOUSEHOLD,
      id: '1',
      name: 'Keller',
    })

    expect(result.ok).toBe(true)
  })

  it('benennt nicht in den Namen eines anderen Ortes um', async () => {
    const { deps } = fakeRepository([location('1', 'Keller'), location('2', 'Küche')])

    const result = await renameStorageLocation(deps, {
      householdId: HOUSEHOLD,
      id: '1',
      name: 'Küche',
    })

    expect(result).toEqual({ ok: false, error: { kind: 'duplicate', isHidden: false } })
  })

  it('meldet einen unbekannten Ort beim Umbenennen', async () => {
    const { deps } = fakeRepository([])

    const result = await renameStorageLocation(deps, {
      householdId: HOUSEHOLD,
      id: 'fremd',
      name: 'Keller',
    })

    expect(result).toEqual({ ok: false, error: { kind: 'not-found' } })
  })

  it('löscht nur einen unbenutzten Ort', async () => {
    const { deps } = fakeRepository([
      location('1', 'Keller', { productCount: 3 }),
      location('2', 'Garage'),
    ])

    expect(await removeStorageLocation(deps, { householdId: HOUSEHOLD, id: '1' })).toEqual({
      ok: false,
      error: { kind: 'in-use' },
    })
    expect(await removeStorageLocation(deps, { householdId: HOUSEHOLD, id: '2' })).toEqual({
      ok: true,
      value: null,
    })
  })

  it('sortiert nur innerhalb der sichtbaren Orte', async () => {
    const { deps, savedOrders } = fakeRepository([
      location('1', 'Keller'),
      location('2', 'Alt', { isHidden: true }),
      location('3', 'Küche'),
    ])

    await moveStorageLocation(deps, { householdId: HOUSEHOLD, id: '3', direction: 'up' })

    expect(savedOrders).toEqual([['3', '1']])
  })

  it('speichert nichts am Rand oder für einen unbekannten Ort', async () => {
    const { deps, savedOrders } = fakeRepository([location('1', 'Keller')])

    await moveStorageLocation(deps, { householdId: HOUSEHOLD, id: '1', direction: 'up' })
    await moveStorageLocation(deps, { householdId: HOUSEHOLD, id: 'x', direction: 'down' })

    expect(savedOrders).toEqual([])
  })
})
