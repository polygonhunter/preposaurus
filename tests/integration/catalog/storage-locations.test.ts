// Lagerorte gegen die DB (#77): Mandantenfilter, Zahl der Produkte, Löschen nur ohne Produkte,
// Reihenfolge. Dazu die Ampel-Schwellen (#78) mit dem CHECK der DB als zweiter Grenze.
import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildHousehold, buildProduct, buildStorageLocation } from '../../../db/seeds/factories'
import {
  createStorageLocationRepository,
  type StorageLocationRepository,
} from '../../../src/features/catalog/data/storage-location-repository'
import { createAmpelSettingsRepository } from '../../../src/features/inventory/data/ampel-settings-repository'
import { storageLocations } from '../../../src/server/db/schema/catalog'
import { householdSettings, households } from '../../../src/server/db/schema/household'
import { products } from '../../../src/server/db/schema/inventory'
import { insertBasics, type Basics } from '../../helpers/db-fixtures'
import { expectConstraintViolation } from '../../helpers/db-errors'
import { createTestDb, type TestDb } from '../../helpers/test-db'

describe('Lagerorte in der Datenbank', () => {
  let testDb: TestDb
  let repository: StorageLocationRepository
  let basics: Basics
  let otherHouseholdId: string

  beforeAll(async () => {
    testDb = await createTestDb()
    repository = createStorageLocationRepository(testDb.db)
    basics = await insertBasics(testDb.db)
    const other = buildHousehold({ name: 'Fremder Haushalt' })
    await testDb.db.insert(households).values(other)
    otherHouseholdId = other.id
  })

  afterAll(async () => {
    await testDb.close()
  })

  const names = async (householdId: string) =>
    (await repository.list(householdId)).map((location) => location.name)

  it('legt Orte am Ende an und lehnt einen doppelten Namen ab', async () => {
    const cellar = await repository.create(basics.householdId, 'Keller')
    const kitchen = await repository.create(basics.householdId, 'Küche')

    expect(cellar).not.toBeNull()
    expect(kitchen).not.toBeNull()
    expect(await repository.create(basics.householdId, 'Keller')).toBeNull()
    expect(await names(basics.householdId)).toEqual(['Keller', 'Küche'])
  })

  it('zeigt einem anderen Haushalt keine fremden Orte und lässt sie nicht ändern', async () => {
    const [own] = await repository.list(basics.householdId)
    if (own === undefined) throw new Error('Ort fehlt')

    expect(await repository.list(otherHouseholdId)).toEqual([])
    expect(await repository.rename(otherHouseholdId, own.id, 'Fremd')).toBe(false)
    expect(await repository.setHidden(otherHouseholdId, own.id, true)).toBe(false)
    expect(await repository.remove(otherHouseholdId, own.id)).toBe('not-found')
    await repository.saveOrder(otherHouseholdId, [own.id])
    expect(await names(basics.householdId)).toEqual(['Keller', 'Küche'])
  })

  it('erlaubt denselben Namen in einem anderen Haushalt', async () => {
    expect(await repository.create(otherHouseholdId, 'Keller')).not.toBeNull()
  })

  it('zählt die Produkte des eigenen Haushalts je Ort', async () => {
    const garage = buildStorageLocation({ householdId: basics.householdId, name: 'Garage' })
    await testDb.db.insert(storageLocations).values(garage)
    await testDb.db
      .update(products)
      .set({ storageLocationId: garage.id })
      .where(eq(products.id, basics.productId))

    const location = (await repository.list(basics.householdId)).find(
      (entry) => entry.id === garage.id,
    )

    expect(location?.productCount).toBe(1)
  })

  it('löscht einen benutzten Ort nicht, einen unbenutzten schon', async () => {
    const locations = await repository.list(basics.householdId)
    const used = locations.find((entry) => entry.productCount > 0)
    const unused = locations.find((entry) => entry.name === 'Küche')
    if (used === undefined || unused === undefined) throw new Error('Orte fehlen')

    expect(await repository.remove(basics.householdId, used.id)).toBe('in-use')
    expect(await repository.remove(basics.householdId, unused.id)).toBe('removed')
    expect(await names(basics.householdId)).not.toContain('Küche')
    const [product] = await testDb.db
      .select({ storageLocationId: products.storageLocationId })
      .from(products)
      .where(eq(products.id, basics.productId))
    expect(product?.storageLocationId).toBe(used.id)
  })

  it('löscht auch einen Ort nicht, an dem nur ein verbrauchtes Produkt hängt', async () => {
    const shelf = await repository.create(basics.householdId, 'Regal')
    if (shelf === null) throw new Error('Ort fehlt')
    await testDb.db.insert(products).values(
      buildProduct({
        householdId: basics.householdId,
        categoryId: basics.categoryId,
        storageLocationId: shelf,
      }),
    )

    expect(await repository.remove(basics.householdId, shelf)).toBe('in-use')
  })

  it('benennt um, blendet aus und speichert die Reihenfolge', async () => {
    const [first, second, ...rest] = await repository.list(basics.householdId)
    if (first === undefined || second === undefined) throw new Error('Orte fehlen')

    expect(await repository.rename(basics.householdId, first.id, 'Vorratskeller')).toBe(true)
    expect(await repository.setHidden(basics.householdId, second.id, true)).toBe(true)
    await repository.saveOrder(basics.householdId, [
      second.id,
      first.id,
      ...rest.map((location) => location.id),
    ])

    const after = await repository.list(basics.householdId)
    expect(after[0]).toMatchObject({ id: second.id, isHidden: true })
    expect(after[1]).toMatchObject({ id: first.id, name: 'Vorratskeller' })
  })
})

describe('Ampel-Schwellen in der Datenbank', () => {
  let testDb: TestDb
  let householdId: string

  beforeAll(async () => {
    testDb = await createTestDb()
    const household = buildHousehold()
    await testDb.db.insert(households).values(household)
    householdId = household.id
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('liest ohne Zeile die Standards und legt sie beim Speichern an', async () => {
    const repository = createAmpelSettingsRepository(testDb.db)

    expect(await repository.read(householdId)).toEqual({ soonDays: 90, urgentDays: 28 })
    await repository.save(householdId, { soonDays: 60, urgentDays: 14 })
    expect(await repository.read(householdId)).toEqual({ soonDays: 60, urgentDays: 14 })
  })

  it('lässt die DB keine Orange-Schwelle über Gelb oder unter 7 Tagen speichern', async () => {
    const repository = createAmpelSettingsRepository(testDb.db)

    await expectConstraintViolation(
      repository.save(householdId, { soonDays: 20, urgentDays: 30 }),
      'haushalt_einstellung_ampel_check',
    )
    await expectConstraintViolation(
      repository.save(householdId, { soonDays: 90, urgentDays: 6 }),
      'haushalt_einstellung_ampel_check',
    )
    const [row] = await testDb.db
      .select({ orange: householdSettings.ampelOrangeDays })
      .from(householdSettings)
      .where(eq(householdSettings.householdId, householdId))
    expect(row?.orange).toBe(14)
  })
})
