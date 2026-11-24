// Neuer Lagerort aus der Erfassung (#301) gegen PGlite: als Mitglied oder Admin, nur im Haushalt
// der Sitzung. Die echten Guards laufen, nur die Sitzung ist vorgegeben. Der neue Ort kommt ans Ende
// der Liste. Gleicher Name ohne Rücksicht auf Groß- und Kleinschreibung ergibt den vorhandenen Ort.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildHousehold } from '../../../db/seeds/factories'
import { createStorageLocationRepository } from '../../../src/features/catalog/data/storage-location-repository'
import type { SessionUser } from '../../../src/server/auth/session'
import type { Database } from '../../../src/server/db/connection'
import { households } from '../../../src/server/db/schema/household'
import { insertBasics, type Basics } from '../../helpers/db-fixtures'
import { createTestDb, type TestDb } from '../../helpers/test-db'

const state = vi.hoisted(() => ({
  user: null as SessionUser | null,
  db: null as Database | null,
}))

vi.mock('next/headers', () => ({ headers: () => Promise.resolve(new Headers()) }))
vi.mock('@/server/auth/get-auth', () => ({ getAuth: () => Promise.resolve({}) }))
vi.mock('@/server/auth/session', () => ({ readSession: () => Promise.resolve(state.user) }))
vi.mock('@/server/db/get-db', () => ({ getDb: () => Promise.resolve(state.db) }))

const { addStorageLocationFromCaptureAction: addLocation } =
  await import('../../../src/features/capture/actions/add-storage-location-action')

describe('Neuer Lagerort aus der Erfassung', () => {
  let testDb: TestDb
  let basics: Basics
  let otherId: string

  const actAs = (householdId: string | null, role: SessionUser['role'] = 'mitglied') => {
    state.user = { id: 'nutzer', name: 'Sam', username: 'sam', role, householdId }
  }

  const locationNames = async (householdId: string) =>
    (await createStorageLocationRepository(testDb.db).list(householdId)).map((entry) => entry.name)

  beforeAll(async () => {
    testDb = await createTestDb()
    state.db = testDb.db
    basics = await insertBasics(testDb.db)
    const other = buildHousehold({ name: 'Fremder Haushalt' })
    await testDb.db.insert(households).values(other)
    otherId = other.id
  })

  beforeEach(() => {
    actAs(basics.householdId)
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('legt als Mitglied im eigenen Haushalt an, am Ende der Liste', async () => {
    const first = await addLocation({ name: ' Keller ' })
    actAs(basics.householdId, 'admin')
    const second = await addLocation({ name: 'Speisekammer' })

    expect(first).toMatchObject({ ok: true, isExisting: false, location: { name: 'Keller' } })
    expect(second).toMatchObject({
      ok: true,
      isExisting: false,
      location: { name: 'Speisekammer' },
    })
    expect(await locationNames(basics.householdId)).toEqual(['Keller', 'Speisekammer'])
    expect(await locationNames(otherId)).toEqual([])
  })

  it('liefert bei gleichem Namen den vorhandenen Ort statt einer Dublette', async () => {
    const before = await createStorageLocationRepository(testDb.db).list(basics.householdId)
    const keller = before.find((entry) => entry.name === 'Keller')

    const outcome = await addLocation({ name: 'KELLER' })

    expect(outcome).toEqual({
      ok: true,
      isExisting: true,
      location: { id: keller?.id, name: 'Keller' },
    })
    expect(await locationNames(basics.householdId)).toEqual(['Keller', 'Speisekammer'])
  })

  it('legt im fremden Haushalt nichts an, auch wenn dort derselbe Name fehlt', async () => {
    actAs(otherId)
    const outcome = await addLocation({ name: 'Keller' })

    expect(outcome).toMatchObject({ ok: true, isExisting: false })
    // Der Ort des fremden Haushalts ist ein anderer als der eigene
    expect(await locationNames(otherId)).toEqual(['Keller'])
    expect(await locationNames(basics.householdId)).toEqual(['Keller', 'Speisekammer'])
  })

  it('wählt keinen ausgeblendeten Ort, sondern verweist auf den Admin', async () => {
    const repository = createStorageLocationRepository(testDb.db)
    const id = await repository.create(basics.householdId, 'Garage')
    if (id === null) throw new Error('Garage fehlt')
    await repository.setHidden(basics.householdId, id, true)

    const outcome = await addLocation({ name: 'garage' })

    expect(outcome.ok).toBe(false)
    expect(outcome.ok ? null : outcome.nameError).toMatch(/ausgeblendet\. Ein Admin kann ihn/)
  })

  it('prüft den Namen und die Sitzung', async () => {
    expect(await addLocation({ name: '   ' })).toMatchObject({
      ok: false,
      nameError: 'Bitte einen Namen eintragen.',
    })
    actAs(null)
    expect(await addLocation({ name: 'Dachboden' })).toMatchObject({
      ok: false,
      message: 'Dafür gehört dein Konto zu keinem Haushalt.',
    })
    state.user = null
    expect(await addLocation({ name: 'Dachboden' })).toMatchObject({ ok: false })
    expect(await locationNames(basics.householdId)).not.toContain('Dachboden')
  })
})
