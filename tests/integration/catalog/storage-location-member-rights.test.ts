// Rechte an Lagerorten (#301) gegen PGlite mit den echten Guards: Ein Mitglied legt beim Erfassen
// neue Orte an, Umbenennen, Ausblenden, Sortieren und Löschen bleiben beim Admin. Jeder Versuch des
// Mitglieds lässt die Orte unverändert, derselbe Aufruf als Admin wirkt.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { addStorageLocationFromCaptureAction } from '../../../src/features/capture/actions/add-storage-location-action'
import { addStorageLocationAction } from '../../../src/features/catalog/actions/add-storage-location-action'
import {
  NAME_FORM_IDLE,
  REMOVE_IDLE,
} from '../../../src/features/catalog/actions/catalog-form-state'
import { hideStorageLocationAction } from '../../../src/features/catalog/actions/hide-storage-location-action'
import { moveStorageLocationAction } from '../../../src/features/catalog/actions/move-storage-location-action'
import { removeStorageLocationAction } from '../../../src/features/catalog/actions/remove-storage-location-action'
import { renameStorageLocationAction } from '../../../src/features/catalog/actions/rename-storage-location-action'
import { createStorageLocationRepository } from '../../../src/features/catalog/data/storage-location-repository'
import type { SessionUser } from '../../../src/server/auth/session'
import type { Database } from '../../../src/server/db/connection'
import { insertBasics, type Basics } from '../../helpers/db-fixtures'
import { createTestDb, type TestDb } from '../../helpers/test-db'

const state = vi.hoisted(() => ({
  user: null as SessionUser | null,
  db: null as Database | null,
}))

vi.mock('next/headers', () => ({ headers: () => Promise.resolve(new Headers()) }))
vi.mock('next/cache', () => ({ refresh: vi.fn(), revalidatePath: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('@/server/auth/get-auth', () => ({ getAuth: () => Promise.resolve({}) }))
vi.mock('@/server/auth/session', () => ({ readSession: () => Promise.resolve(state.user) }))
vi.mock('@/server/db/get-db', () => ({ getDb: () => Promise.resolve(state.db) }))

const form = (fields: Record<string, string>) => {
  const data = new FormData()
  for (const [name, value] of Object.entries(fields)) data.set(name, value)
  return data
}

describe('Rechte an Lagerorten', () => {
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

  const locations = async () => createStorageLocationRepository(testDb.db).list(basics.householdId)

  async function addAsMember(name: string) {
    actAs('mitglied')
    const outcome = await addStorageLocationFromCaptureAction({ name })
    if (!outcome.ok) throw new Error(`${name} fehlt`)
    return outcome.location.id
  }

  beforeAll(async () => {
    testDb = await createTestDb()
    state.db = testDb.db
    basics = await insertBasics(testDb.db)
    firstId = await addAsMember('Keller')
    secondId = await addAsMember('Speisekammer')
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('lässt ein Mitglied beim Erfassen anlegen', async () => {
    expect((await locations()).map((entry) => entry.name)).toEqual(['Keller', 'Speisekammer'])
  })

  it('lässt ein Mitglied nichts umbenennen, ausblenden, sortieren oder löschen', async () => {
    const before = await locations()
    actAs('mitglied')

    const renamed = await renameStorageLocationAction(
      NAME_FORM_IDLE,
      form({ id: firstId, name: 'Kellerregal' }),
    )
    await hideStorageLocationAction(form({ id: firstId, ausblenden: 'ja' }))
    await moveStorageLocationAction(form({ id: secondId, richtung: 'up' }))
    const removed = await removeStorageLocationAction(REMOVE_IDLE, form({ id: secondId }))
    // Das Formular der Einstellungen bleibt eine Admin-Seite
    const addedInSettings = await addStorageLocationAction(NAME_FORM_IDLE, form({ name: 'Garage' }))

    expect(renamed.message).toBe('Das ändert ein Admin.')
    expect(removed.message).toBe('Das ändert ein Admin.')
    expect(addedInSettings.message).toBe('Das ändert ein Admin.')
    expect(await locations()).toEqual(before)
  })

  it('lässt dieselben Aufrufe als Admin wirken', async () => {
    actAs('admin')

    await renameStorageLocationAction(NAME_FORM_IDLE, form({ id: firstId, name: 'Kellerregal' }))
    // Sortiert wird innerhalb der sichtbaren Orte, also vor dem Ausblenden
    await moveStorageLocationAction(form({ id: secondId, richtung: 'up' }))
    await hideStorageLocationAction(form({ id: firstId, ausblenden: 'ja' }))

    expect(await locations()).toMatchObject([
      { name: 'Speisekammer', isHidden: false },
      { name: 'Kellerregal', isHidden: true },
    ])
    await removeStorageLocationAction(REMOVE_IDLE, form({ id: secondId }))
    expect((await locations()).map((entry) => entry.name)).toEqual(['Kellerregal'])
  })
})
