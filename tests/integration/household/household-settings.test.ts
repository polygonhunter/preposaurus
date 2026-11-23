import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildHousehold, buildMember, buildUser } from '../../../db/seeds/factories'
import { createHouseholdSettingsRepository } from '../../../src/features/household/data/household-settings-repository'
import {
  createMemberRepository,
  type MemberRepository,
} from '../../../src/features/household/data/member-repository'
import type { MemberValues } from '../../../src/features/household/domain/member'
import { createUserAdminRepository } from '../../../src/features/auth/data/user-admin-repository'
import { users } from '../../../src/server/db/schema/account'
import {
  householdSettings,
  households,
  memberAllergies,
  members,
} from '../../../src/server/db/schema/household'
import { toCalendarDay } from '../../../src/shared/lib/dates'
import { createTestDb, type TestDb } from '../../helpers/test-db'

const values = (overrides: Partial<MemberValues> = {}): MemberValues => ({
  name: 'Kim',
  type: 'kind',
  birthDate: toCalendarDay('2016-01-01'),
  sex: null,
  activityLevel: null,
  weightKg: null,
  condition: null,
  diet: null,
  allergies: [],
  ...overrides,
})

describe('Mitglieder und Regeln in der Datenbank', () => {
  let testDb: TestDb
  let repository: MemberRepository
  let ownId: string
  let otherId: string

  beforeAll(async () => {
    testDb = await createTestDb()
    repository = createMemberRepository(testDb.db)
    const own = buildHousehold()
    const other = buildHousehold({ name: 'Fremder Haushalt' })
    await testDb.db.insert(households).values([own, other])
    ownId = own.id
    otherId = other.id
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('legt eine Person mit Allergien an und liest sie zurück', async () => {
    const id = await repository.create(
      ownId,
      values({ weightKg: 31.5, diet: 'vegan', allergies: ['Erdnüsse', 'Gluten'] }),
    )

    expect(await repository.find(ownId, id)).toEqual({
      ...values({ weightKg: 31.5, diet: 'vegan', allergies: ['Erdnüsse', 'Gluten'] }),
      id,
    })
  })

  it('ersetzt beim Ändern die Allergien als Ganzes', async () => {
    const id = await repository.create(ownId, values({ allergies: ['Gluten'] }))

    const isUpdated = await repository.update(
      ownId,
      id,
      values({
        name: 'Kim B.',
        type: 'baby',
        birthDate: toCalendarDay('2026-04-01'),
        allergies: ['Laktose'],
      }),
    )

    expect(isUpdated).toBe(true)
    expect(await repository.find(ownId, id)).toMatchObject({
      name: 'Kim B.',
      type: 'baby',
      birthDate: '2026-04-01',
      allergies: ['Laktose'],
    })
  })

  it('findet, ändert und entfernt keine Person eines anderen Haushalts', async () => {
    const foreignId = await repository.create(otherId, values({ name: 'Fremd' }))

    expect(await repository.find(ownId, foreignId)).toBeNull()
    expect(await repository.update(ownId, foreignId, values({ name: 'Übernommen' }))).toBe(false)
    expect(await repository.remove(ownId, foreignId)).toBe(false)
    expect((await repository.list(ownId)).map((member) => member.name)).not.toContain('Fremd')
    expect(await repository.find(otherId, foreignId)).toMatchObject({ name: 'Fremd' })
  })

  it('entfernt eine Person samt Allergien, ein verknüpfter Login bleibt', async () => {
    const member = buildMember({ householdId: ownId, name: 'Sam' })
    await testDb.db.insert(members).values(member)
    await testDb.db.insert(memberAllergies).values({ memberId: member.id, label: 'Soja' })
    const user = buildUser({ householdId: ownId, memberId: member.id })
    await testDb.db.insert(users).values(user)

    expect(await repository.remove(ownId, member.id)).toBe(true)

    const [login] = await testDb.db.select().from(users).where(eq(users.id, user.id))
    expect(login).toMatchObject({ isActive: true, memberId: null })
    const allergies = await testDb.db
      .select()
      .from(memberAllergies)
      .where(eq(memberAllergies.memberId, member.id))
    expect(allergies).toEqual([])
  })

  it('legt fehlende Haushaltseinstellungen beim ersten Speichern an', async () => {
    const settings = createHouseholdSettingsRepository(testDb.db)

    expect(await settings.read(ownId)).toEqual({ defaultDiet: 'alles', stillGoodCounts: false })
    await settings.update(ownId, { stillGoodCounts: true })
    await settings.update(ownId, { defaultDiet: 'vegetarisch' })

    expect(await settings.read(ownId)).toEqual({
      defaultDiet: 'vegetarisch',
      stillGoodCounts: true,
    })
    expect(await settings.read(otherId)).toEqual({ defaultDiet: 'alles', stillGoodCounts: false })
    const rows = await testDb.db
      .select()
      .from(householdSettings)
      .where(eq(householdSettings.householdId, ownId))
    expect(rows).toHaveLength(1)
  })

  it('listet nur die Nutzer des eigenen Haushalts, mit verknüpfter Person', async () => {
    const member = buildMember({ householdId: ownId, name: 'Robin' })
    await testDb.db.insert(members).values(member)
    await testDb.db
      .insert(users)
      .values([
        buildUser({ householdId: ownId, name: 'Robin', role: 'admin', memberId: member.id }),
        buildUser({ householdId: otherId, name: 'Fremd' }),
      ])

    const list = await createUserAdminRepository(testDb.db).list(ownId)

    expect(list.map((user) => user.name)).not.toContain('Fremd')
    expect(list.find((user) => user.name === 'Robin')).toMatchObject({
      role: 'admin',
      isActive: true,
      memberName: 'Robin',
    })
    expect(Object.keys(list[0] ?? {})).not.toContain('email')
  })
})
