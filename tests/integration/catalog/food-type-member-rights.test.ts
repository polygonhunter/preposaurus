// Rechte an Lebensmittelarten (#298) gegen PGlite mit den echten Guards: Ein Mitglied legt beim
// Erfassen neue Arten an, Ändern (samt Richtwerten), Ausblenden, Sortieren und Löschen bleiben beim
// Admin. Jeder Versuch des Mitglieds lässt die Arten unverändert, derselbe Aufruf als Admin wirkt.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { addFoodTypeAction } from '../../../src/features/capture/actions/add-food-type-action'
import { REMOVE_IDLE } from '../../../src/features/catalog/actions/catalog-form-state'
import { entryFormIdle } from '../../../src/features/catalog/actions/entry-form-state'
import { hideFoodTypeAction } from '../../../src/features/catalog/actions/hide-food-type-action'
import { moveFoodTypeAction } from '../../../src/features/catalog/actions/move-food-type-action'
import { removeFoodTypeAction } from '../../../src/features/catalog/actions/remove-food-type-action'
import { saveFoodTypeAction } from '../../../src/features/catalog/actions/save-food-type-action'
import { createFoodTypeRepository } from '../../../src/features/catalog/data/food-type-repository'
import type { SessionUser } from '../../../src/server/auth/session'
import type { Database } from '../../../src/server/db/connection'
import { insertBasics, type Basics } from '../../helpers/db-fixtures'
import { createTestDb, type TestDb } from '../../helpers/test-db'

const state = vi.hoisted(() => ({
  user: null as SessionUser | null,
  db: null as Database | null,
}))

vi.mock('next/headers', () => ({ headers: () => Promise.resolve(new Headers()) }))
vi.mock('next/cache', () => ({ refresh: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('@/server/auth/get-auth', () => ({ getAuth: () => Promise.resolve({}) }))
vi.mock('@/server/auth/session', () => ({ readSession: () => Promise.resolve(state.user) }))
vi.mock('@/server/db/get-db', () => ({ getDb: () => Promise.resolve(state.db) }))

const form = (fields: Record<string, string>) => {
  const data = new FormData()
  for (const [name, value] of Object.entries(fields)) data.set(name, value)
  return data
}

describe('Rechte an Lebensmittelarten', () => {
  let testDb: TestDb
  let basics: Basics
  let firstId: string
  let secondId: string

  const actAs = (role: SessionUser['role']) => {
    state.user = {
      id: 'nutzer',
      name: 'Sam',
      username: 'sam',
      role,
      householdId: basics.householdId,
    }
  }

  const ownFoodTypes = async () =>
    (await createFoodTypeRepository(testDb.db).list(basics.householdId)).filter(
      (entry) => !entry.isSystem,
    )

  async function addAsMember(name: string) {
    actAs('mitglied')
    const outcome = await addFoodTypeAction({ name, categoryId: basics.categoryId })
    if (!outcome.ok) throw new Error(`${name} fehlt`)
    return outcome.foodType.id
  }

  beforeAll(async () => {
    testDb = await createTestDb()
    state.db = testDb.db
    basics = await insertBasics(testDb.db)
    firstId = await addAsMember('Buchweizen')
    secondId = await addAsMember('Kamutgrieß')
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('lässt ein Mitglied beim Erfassen anlegen', async () => {
    expect((await ownFoodTypes()).map((entry) => entry.name)).toEqual(['Buchweizen', 'Kamutgrieß'])
  })

  it('lässt ein Mitglied nichts ändern, ausblenden, sortieren oder löschen', async () => {
    const before = await ownFoodTypes()
    actAs('mitglied')

    const saved = await saveFoodTypeAction(
      entryFormIdle(),
      form({ id: firstId, name: 'Buchweizen geschält', kategorie: basics.categoryId, kcal: '343' }),
    )
    await hideFoodTypeAction(form({ id: firstId, ausblenden: 'ja' }))
    await moveFoodTypeAction(form({ id: secondId, richtung: 'up' }))
    const removed = await removeFoodTypeAction(REMOVE_IDLE, form({ id: secondId }))

    expect(saved.message).toBe('Das ändert ein Admin.')
    expect(removed.message).toBe('Das ändert ein Admin.')
    expect(await ownFoodTypes()).toEqual(before)
  })

  it('lässt dieselben Aufrufe als Admin wirken', async () => {
    actAs('admin')

    await saveFoodTypeAction(
      entryFormIdle(),
      form({ id: firstId, name: 'Buchweizen geschält', kategorie: basics.categoryId, kcal: '343' }),
    )
    await hideFoodTypeAction(form({ id: firstId, ausblenden: 'ja' }))
    await moveFoodTypeAction(form({ id: secondId, richtung: 'up' }))

    expect(await ownFoodTypes()).toMatchObject([
      { name: 'Kamutgrieß' },
      { name: 'Buchweizen geschält', kcalPer100: 343, isHidden: true },
    ])
    await removeFoodTypeAction(REMOVE_IDLE, form({ id: secondId }))
    expect((await ownFoodTypes()).map((entry) => entry.name)).toEqual(['Buchweizen geschält'])
  })
})
