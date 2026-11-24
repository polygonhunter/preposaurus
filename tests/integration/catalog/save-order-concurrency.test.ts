// Gleichzeitiges Sortieren (#281): Zwei Admins speichern zur selben Zeit gegenläufige
// Reihenfolgen. Ohne feste Sperr-Reihenfolge laufen die Transaktionen in einen Deadlock und eine
// scheitert. Nur gegen PostgreSQL (CI-Job test-pg): PGlite hat eine einzige Verbindung, dort gibt
// es keine echte Nebenläufigkeit.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createFoodTypeRepository } from '../../../src/features/catalog/data/food-type-repository'
import { createStorageLocationRepository } from '../../../src/features/catalog/data/storage-location-repository'
import { insertBasics, type Basics } from '../../helpers/db-fixtures'
import { createTestDb, testPostgresUrl, type TestDb } from '../../helpers/test-db'

const ENTRY_COUNT = 30
const ROUNDS = 5

type SaveOrder = (householdId: string, ids: readonly string[]) => Promise<void>

const entryNames = Array.from({ length: ENTRY_COUNT }, (_, index) => `Eintrag ${String(index + 1)}`)

async function saveOppositeOrdersAtOnce(saveOrder: SaveOrder, householdId: string, ids: string[]) {
  const reversed = ids.toReversed()
  for (let round = 0; round < ROUNDS; round += 1) {
    await Promise.all([saveOrder(householdId, ids), saveOrder(householdId, reversed)])
  }
}

describe.runIf(testPostgresUrl() !== undefined)('Reihenfolge gleichzeitig speichern', () => {
  let testDb: TestDb
  let basics: Basics

  beforeAll(async () => {
    testDb = await createTestDb()
    basics = await insertBasics(testDb.db)
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('läuft bei Lagerorten nicht in einen Deadlock', async () => {
    const repository = createStorageLocationRepository(testDb.db)
    const ids: string[] = []
    for (const name of entryNames) {
      const id = await repository.create(basics.householdId, name)
      if (id === null) throw new Error(`${name} fehlt`)
      ids.push(id)
    }

    await expect(
      saveOppositeOrdersAtOnce(repository.saveOrder, basics.householdId, ids),
    ).resolves.toBeUndefined()
    expect((await repository.list(basics.householdId)).length).toBe(ENTRY_COUNT)
  })

  it('läuft bei eigenen Lebensmittelarten nicht in einen Deadlock', async () => {
    const repository = createFoodTypeRepository(testDb.db)
    const ids: string[] = []
    for (const [index, name] of entryNames.entries()) {
      const id = await repository.create(basics.householdId, {
        name,
        key: `eigen_eintrag_${String(index)}`,
        categoryId: basics.categoryId,
        searchTerms: [],
        kcalPer100: null,
        proteinPer100: null,
        carbsPer100: null,
        fatPer100: null,
        typicalShelfLifeMonths: null,
      })
      if (id === null) throw new Error(`${name} fehlt`)
      ids.push(id)
    }

    await expect(
      saveOppositeOrdersAtOnce(repository.saveOrder, basics.householdId, ids),
    ).resolves.toBeUndefined()
  })
})
