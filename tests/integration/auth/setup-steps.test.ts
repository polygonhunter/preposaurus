import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { buildUser } from '../../../db/seeds/factories'
import {
  completeSetupStep,
  findOpenSetupStep,
  type SetupStepDeps,
} from '../../../src/features/auth/application/setup-steps'
import { createFirstAdminRepository } from '../../../src/features/auth/data/first-admin-repository'
import { createSetupProgressRepository } from '../../../src/features/auth/data/setup-progress-repository'
import { users } from '../../../src/server/db/schema/account'
import { householdSettings, households } from '../../../src/server/db/schema/household'
import { createTestDb, type TestDb } from '../../helpers/test-db'

const NOW = new Date('2026-11-23T09:00:00Z')

describe('Folgeschritte der Einrichtung in der DB (#40)', () => {
  let testDb: TestDb
  let deps: SetupStepDeps

  const settings = async () => {
    const [row] = await testDb.db
      .select({
        step: householdSettings.setupStep,
        completedAt: householdSettings.setupCompletedAt,
      })
      .from(householdSettings)
    return row
  }

  const setUp = async () => {
    await createFirstAdminRepository(testDb.db).createFirstAdmin({
      displayName: 'Kim Test',
      username: 'kim.test',
      passwordHash: 'hash',
      householdName: 'Unser Haushalt',
      goalDays: 10,
    })
    const [admin] = await testDb.db.select().from(users)
    if (!admin?.householdId) throw new Error('Einrichtung fehlt')
    return { adminId: admin.id, householdId: admin.householdId }
  }

  beforeAll(async () => {
    testDb = await createTestDb()
    deps = { repository: createSetupProgressRepository(testDb.db), now: () => NOW }
  })

  beforeEach(async () => {
    await testDb.db.delete(households)
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('nach dem Konto ist „Mitglieder“ offen, Fortschritt und Abschluss stehen in der DB', async () => {
    const { adminId } = await setUp()
    const query = { userId: adminId, showsHomeStep: false }

    expect(await findOpenSetupStep(deps, query)).toBe('mitglieder')
    await completeSetupStep(deps, { ...query, step: 'mitglieder' })
    expect(await settings()).toEqual({ step: 2, completedAt: null })
    expect(await findOpenSetupStep(deps, query)).toBe('ziel')

    await completeSetupStep(deps, { ...query, step: 'ziel' })
    expect(await settings()).toEqual({ step: 3, completedAt: null })
    expect(await findOpenSetupStep(deps, query)).toBe('foto-erkennung')

    await completeSetupStep(deps, { ...query, step: 'foto-erkennung' })

    expect(await settings()).toEqual({ step: 4, completedAt: NOW })
    expect(await findOpenSetupStep(deps, query)).toBeNull()
  })

  it('Zurückblättern senkt den Fortschritt nicht, nach dem Abschluss ändert sich nichts', async () => {
    const { adminId } = await setUp()
    const query = { userId: adminId, showsHomeStep: true }
    await completeSetupStep(deps, { ...query, step: 'foto-erkennung' })

    await completeSetupStep(deps, { ...query, step: 'mitglieder' })
    expect(await settings()).toEqual({ step: 4, completedAt: null })
    expect(await findOpenSetupStep(deps, query)).toBe('home-bildschirm')

    await completeSetupStep(deps, { ...query, step: 'home-bildschirm' })
    const later = { ...deps, now: () => new Date('2026-12-01T09:00:00Z') }
    expect(await completeSetupStep(later, { ...query, step: 'ziel' })).toEqual({
      ok: false,
      error: { kind: 'setup-closed' },
    })
    expect(await settings()).toEqual({ step: 5, completedAt: NOW })
  })

  it('nur der Admin, der eingerichtet hat, sieht die Schritte, auch kein späterer Admin', async () => {
    const { adminId, householdId } = await setUp()
    const later = new Date(Date.now() + 60_000)
    const member = buildUser({ householdId, role: 'mitglied', createdAt: later })
    const secondAdmin = buildUser({ householdId, role: 'admin', createdAt: later })
    await testDb.db.insert(users).values([member, secondAdmin])

    expect(await findOpenSetupStep(deps, { userId: member.id, showsHomeStep: false })).toBeNull()
    expect(
      await findOpenSetupStep(deps, { userId: secondAdmin.id, showsHomeStep: false }),
    ).toBeNull()
    expect(await findOpenSetupStep(deps, { userId: adminId, showsHomeStep: false })).toBe(
      'mitglieder',
    )
  })

  it('Haushalte, die nicht über die Einrichtung entstanden sind, zeigen keine Schritte', async () => {
    const { adminId, householdId } = await setUp()
    await testDb.db
      .update(householdSettings)
      .set({ setupStep: null })
      .where(eq(householdSettings.householdId, householdId))

    expect(await findOpenSetupStep(deps, { userId: adminId, showsHomeStep: true })).toBeNull()
  })
})
