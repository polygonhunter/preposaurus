import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import type {
  HouseholdRules,
  HouseholdSettingsRepository,
} from '../data/household-settings-repository'
import type { MemberRepository } from '../data/member-repository'
import type { Member, MemberValues } from '../domain/member'
import { memberSchema, type MemberInput } from '../schemas'
import { getHousehold } from './get-household'
import { removeMember, saveMember } from './save-member'
import { updateHouseholdRules } from './update-household-rules'

// Fakes wie die echten Repositories: getrennt nach Haushalt.
type StoredMember = Member & { householdId: string }

function createFakeMemberRepository(initial: StoredMember[] = []) {
  const rows = [...initial]
  const inHousehold = (householdId: string, memberId: string) => (row: StoredMember) =>
    row.householdId === householdId && row.id === memberId
  const repository: MemberRepository = {
    list: (householdId) => Promise.resolve(rows.filter((row) => row.householdId === householdId)),
    find: (householdId, memberId) =>
      Promise.resolve(rows.find(inHousehold(householdId, memberId)) ?? null),
    create: (householdId, values: MemberValues) => {
      const id = `mitglied-${String(rows.length + 1)}`
      rows.push({ ...values, id, householdId })
      return Promise.resolve(id)
    },
    update: (householdId, memberId, values) => {
      const index = rows.findIndex(inHousehold(householdId, memberId))
      if (index < 0) return Promise.resolve(false)
      rows[index] = { ...values, id: memberId, householdId }
      return Promise.resolve(true)
    },
    remove: (householdId, memberId) => {
      const index = rows.findIndex(inHousehold(householdId, memberId))
      if (index < 0) return Promise.resolve(false)
      rows.splice(index, 1)
      return Promise.resolve(true)
    },
  }
  return { repository, rows }
}

function createFakeSettingsRepository(initial: Partial<HouseholdRules> = {}) {
  const byHousehold = new Map<string, HouseholdRules>()
  const defaults: HouseholdRules = { defaultDiet: 'alles', stillGoodCounts: false, ...initial }
  const repository: HouseholdSettingsRepository = {
    read: (householdId) => Promise.resolve(byHousehold.get(householdId) ?? defaults),
    update: (householdId, change) => {
      byHousehold.set(householdId, { ...(byHousehold.get(householdId) ?? defaults), ...change })
      return Promise.resolve()
    },
  }
  return { repository, byHousehold }
}

const today = toCalendarDay('2026-11-23')
const HOUSEHOLD = 'haushalt-1'
const OTHER_HOUSEHOLD = 'haushalt-2'

const input = (overrides: Partial<Record<string, string>> = {}): MemberInput =>
  memberSchema.parse({
    name: 'Kim',
    type: 'kind',
    birthYear: '2016',
    birthMonth: '',
    sex: '',
    activityLevel: '',
    weightKg: '',
    condition: '',
    diet: '',
    allergies: '',
    ...overrides,
  })

describe('Mitglied speichern', () => {
  it('legt eine Person an und speichert das Geburtsjahr als 1. Januar', async () => {
    const { repository, rows } = createFakeMemberRepository()

    const result = await saveMember(
      { members: repository, today },
      { householdId: HOUSEHOLD, memberId: null, input: input() },
    )

    expect(result.ok).toBe(true)
    expect(rows).toEqual([
      expect.objectContaining({ name: 'Kim', type: 'kind', birthDate: '2016-01-01', diet: null }),
    ])
  })

  it('speichert bei Babys den Monat und lehnt ein Baby ohne Monat ab', async () => {
    const { repository, rows } = createFakeMemberRepository()
    const deps = { members: repository, today }

    const missing = await saveMember(deps, {
      householdId: HOUSEHOLD,
      memberId: null,
      input: input({ type: 'baby', birthYear: '2026' }),
    })
    const withMonth = await saveMember(deps, {
      householdId: HOUSEHOLD,
      memberId: null,
      input: input({ type: 'baby', birthYear: '2026', birthMonth: '4' }),
    })

    expect(missing).toEqual({ ok: false, error: { kind: 'birth', problem: 'month-missing' } })
    expect(withMonth.ok).toBe(true)
    expect(rows.map((row) => row.birthDate)).toEqual(['2026-04-01'])
  })

  it('lehnt ein Geburtsjahr in der Zukunft ab', async () => {
    const { repository, rows } = createFakeMemberRepository()

    const result = await saveMember(
      { members: repository, today },
      { householdId: HOUSEHOLD, memberId: null, input: input({ birthYear: '2027' }) },
    )

    expect(result).toEqual({ ok: false, error: { kind: 'birth', problem: 'in-future' } })
    expect(rows).toEqual([])
  })

  it('ändert nur Personen des eigenen Haushalts', async () => {
    const { repository, rows } = createFakeMemberRepository()
    const deps = { members: repository, today }
    const created = await saveMember(deps, {
      householdId: OTHER_HOUSEHOLD,
      memberId: null,
      input: input(),
    })
    if (!created.ok) throw new Error('Anlegen hätte klappen sollen')

    const result = await saveMember(deps, {
      householdId: HOUSEHOLD,
      memberId: created.value.memberId,
      input: input({ name: 'Fremd' }),
    })
    const removed = await removeMember(deps, {
      householdId: HOUSEHOLD,
      memberId: created.value.memberId,
    })

    expect(result).toEqual({ ok: false, error: { kind: 'not-found' } })
    expect(removed).toEqual({ ok: false, error: { kind: 'not-found' } })
    expect(rows.map((row) => row.name)).toEqual(['Kim'])
  })

  it('übernimmt Ernährungsform, freiwillige Angaben und Allergien', async () => {
    const { repository, rows } = createFakeMemberRepository()

    await saveMember(
      { members: repository, today },
      {
        householdId: HOUSEHOLD,
        memberId: null,
        input: input({
          type: 'erwachsen',
          birthYear: '1988',
          diet: 'vegan',
          sex: 'divers',
          activityLevel: 'viel',
          weightKg: '72,5',
          allergies: 'Gluten, Erdnüsse, gluten',
        }),
      },
    )

    expect(rows[0]).toMatchObject({
      diet: 'vegan',
      sex: 'divers',
      activityLevel: 'viel',
      weightKg: 72.5,
      allergies: ['Gluten', 'Erdnüsse'],
    })
  })

  it('entfernt eine Person', async () => {
    const { repository, rows } = createFakeMemberRepository()
    const deps = { members: repository, today }
    const created = await saveMember(deps, {
      householdId: HOUSEHOLD,
      memberId: null,
      input: input(),
    })
    if (!created.ok) throw new Error('Anlegen hätte klappen sollen')

    const result = await removeMember(deps, {
      householdId: HOUSEHOLD,
      memberId: created.value.memberId,
    })

    expect(result.ok).toBe(true)
    expect(rows).toEqual([])
  })
})

describe('Regeln des Haushalts', () => {
  it('ändert eine Regel und lässt die andere stehen', async () => {
    const settings = createFakeSettingsRepository()
    const members = createFakeMemberRepository().repository

    await updateHouseholdRules(
      { settings: settings.repository },
      { householdId: HOUSEHOLD, change: { stillGoodCounts: true } },
    )
    await updateHouseholdRules(
      { settings: settings.repository },
      { householdId: HOUSEHOLD, change: { defaultDiet: 'vegetarisch' } },
    )

    expect(await getHousehold({ members, settings: settings.repository }, HOUSEHOLD)).toEqual({
      members: [],
      rules: { defaultDiet: 'vegetarisch', stillGoodCounts: true },
    })
    expect(
      (await getHousehold({ members, settings: settings.repository }, OTHER_HOUSEHOLD)).rules,
    ).toEqual({ defaultDiet: 'alles', stillGoodCounts: false })
  })
})
