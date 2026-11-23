// Auswahllisten des Erfassens gegen die DB (#52): Mandantenfilter, Ausgeblendetes, Vorbelegung aus
// der letzten Erfassung des Nutzers und „Vorrat leer“ für den ersten Start.
import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createStock } from '../../../src/features/capture/application/create-stock'
import { getCaptureOptions } from '../../../src/features/capture/application/get-capture-options'
import { createCaptureOptionsRepository } from '../../../src/features/capture/data/capture-options-repository'
import { createStockWriteRepository } from '../../../src/features/capture/data/stock-write-repository'
import { createStockSchema } from '../../../src/features/capture/schemas/stock'
import { storageLocations } from '../../../src/server/db/schema/catalog'
import { foodTypes } from '../../../src/server/db/schema/food-types'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { setupCreateStock, type CreateStockSetup } from './create-stock-fixtures'

describe('Auswahllisten des Erfassens gegen die DB (#52)', () => {
  let testDb: TestDb
  let setup: CreateStockSetup

  beforeAll(async () => {
    testDb = await createTestDb()
    setup = await setupCreateStock(testDb.db)
  })

  afterAll(async () => {
    await testDb.close()
  })

  const optionsFor = (actor: { householdId: string; userId: string }) =>
    getCaptureOptions(createCaptureOptionsRepository(testDb.db), actor)

  async function saveNoodles(storageLocationId: string | null) {
    const draft = createStockSchema.parse({
      captureId: randomUUID(),
      method: 'manual',
      product: {
        kind: 'new',
        foodTypeId: setup.noodlesId,
        content: { value: 500, unit: 'g' },
        containerId: setup.packageId,
        storageLocationId,
      },
      units: [{ bestBefore: null, count: 1 }],
    })
    const writer = createStockWriteRepository(testDb.db)
    const result = await createStock(
      { writer, now: () => new Date('2026-11-22T10:00:00Z') },
      { householdId: setup.householdId, userId: setup.userId, draft },
    )
    if (!result.ok) throw new Error('Speichern fehlgeschlagen')
  }

  it('liefert System-Arten mit Pfad, Behälter und nur eigene Lagerorte, Vorrat noch leer', async () => {
    const options = await optionsFor(setup)

    const noodles = options.foodTypes.find((foodType) => foodType.id === setup.noodlesId)
    expect(noodles).toMatchObject({ name: 'Nudeln', kcalPer100: expect.any(Number) as number })
    expect(noodles?.categoryName).not.toBe('')
    expect(noodles?.productGroupName).not.toBe('')
    expect(options.foodTypes.map((foodType) => foodType.id)).not.toContain(setup.foreign.foodTypeId)
    expect(options.containers.map((container) => container.id)).toContain(setup.packageId)
    expect(options.storageLocations).toEqual([{ id: setup.storageLocationId, name: 'Keller' }])
    expect(options.lastStorageLocationId).toBeNull()
    expect(options.recentFoodTypeIds).toEqual([])
    expect(options.isStockEmpty).toBe(true)
    expect(options.knownProducts).toEqual([])
  })

  it('belegt nach einer Erfassung Lagerort und „Zuletzt genutzt“ vor, nur für diesen Nutzer', async () => {
    await saveNoodles(setup.storageLocationId)
    await saveNoodles(null)

    const own = await optionsFor(setup)
    expect(own.lastStorageLocationId).toBe(setup.storageLocationId)
    expect(own.recentFoodTypeIds).toEqual([setup.noodlesId])
    expect(own.isStockEmpty).toBe(false)
    // Wiedererkennen (#207): beide Produkte (zwei Lagerorte), mit Behälter und Lagerort
    expect(own.knownProducts).toHaveLength(2)
    expect(own.knownProducts).toContainEqual({
      id: expect.any(String) as string,
      name: 'Nudeln',
      foodTypeId: setup.noodlesId,
      content: { value: 500, unit: 'g' },
      containerId: setup.packageId,
      containerName: expect.any(String) as string,
      storageLocationName: 'Keller',
    })

    const foreign = await optionsFor(setup.foreign)
    expect(foreign.storageLocations).toEqual([
      { id: setup.foreign.storageLocationId, name: 'Fremder Keller' },
    ])
    expect(foreign.foodTypes.map((foodType) => foodType.id)).toContain(setup.foreign.foodTypeId)
    expect(foreign.recentFoodTypeIds).toEqual([])
    expect(foreign.isStockEmpty).toBe(true)
    expect(foreign.knownProducts).toEqual([])
  })

  it('bietet Ausgeblendetes nicht an und belegt damit nicht vor', async () => {
    await testDb.db
      .update(storageLocations)
      .set({ isHidden: true })
      .where(eq(storageLocations.id, setup.storageLocationId))
    await testDb.db
      .update(foodTypes)
      .set({ isHidden: true })
      .where(eq(foodTypes.id, setup.noodlesId))

    const options = await optionsFor(setup)
    expect(options.storageLocations).toEqual([])
    expect(options.lastStorageLocationId).toBeNull()
    expect(options.foodTypes.map((foodType) => foodType.id)).not.toContain(setup.noodlesId)
    expect(options.recentFoodTypeIds).toEqual([])
  })
})
