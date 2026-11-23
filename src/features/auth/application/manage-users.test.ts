import { describe, expect, it } from 'vitest'
import type { HouseholdUser, ManagedUser, UserAdminRepository } from '../data/user-admin-repository'
import { createUser } from './create-user'
import {
  changeUserRole,
  endUserSessions,
  linkUserToMember,
  setUserActiveState,
} from './manage-users'
import { resetUserPassword } from './reset-user-password'
import type { UserAdminServices } from './user-admin-services'

const HOUSEHOLD = 'haushalt-1'
const NOW = new Date('2026-11-23T09:00:00Z')

type NewUser = Parameters<UserAdminRepository['create']>[0]

type FakeUser = ManagedUser & { householdId: string; name: string; username: string }

// Fake wie das echte Repository: getrennt nach Haushalt, Sitzungen und Passwörter mitgeschrieben.
function fakeServices(initial: FakeUser[], members: Record<string, string> = {}) {
  const users = initial.map((user) => ({ ...user }))
  const endedSessions: string[] = []
  const created: NewUser[] = []
  const resets: unknown[] = []
  const inHousehold = (householdId: string) => users.filter((u) => u.householdId === householdId)
  const view = (user: FakeUser): HouseholdUser => ({
    ...user,
    lastSignInAt: null,
    memberName: null,
    isPasswordTemporary: false,
    passwordChangedAt: null,
  })
  const repository: UserAdminRepository = {
    list: (householdId) => Promise.resolve(inHousehold(householdId).map(view)),
    find: (householdId, userId) => {
      const user = inHousehold(householdId).find((entry) => entry.id === userId)
      return Promise.resolve(user === undefined ? null : view(user))
    },
    inTransaction: (householdId, work) =>
      work({
        lockUsers: () =>
          Promise.resolve(
            inHousehold(householdId).map(({ id, role, isActive, memberId }) => ({
              id,
              role,
              isActive,
              memberId,
            })),
          ),
        update: (userId, change) => {
          const user = inHousehold(householdId).find((entry) => entry.id === userId)
          if (user !== undefined) Object.assign(user, change)
          return Promise.resolve()
        },
        endSessions: (userId) => {
          endedSessions.push(userId)
          return Promise.resolve()
        },
      }),
    isMemberInHousehold: (householdId, memberId) =>
      Promise.resolve(members[memberId] === householdId),
    readHouseholdName: () => Promise.resolve('Unser Haushalt'),
    create: (user) => {
      if (users.some((entry) => entry.username === user.username)) return Promise.resolve(null)
      created.push(user)
      return Promise.resolve(`nutzer-${String(created.length)}`)
    },
  }
  const services: UserAdminServices = {
    users: repository,
    passwords: {
      resetPassword: (reset) => {
        resets.push(reset)
        return Promise.resolve()
      },
    },
    hashPassword: (password) => Promise.resolve(`hash:${password}`),
    generatePassword: () => 'kmnp-qrst-uvwx-yz23-4567',
    now: () => NOW,
  }
  return { services, users, endedSessions, created, resets }
}

const user = (id: string, overrides: Partial<FakeUser> = {}): FakeUser => ({
  id,
  role: 'mitglied',
  isActive: true,
  memberId: null,
  householdId: HOUSEHOLD,
  name: id,
  username: id,
  ...overrides,
})

const alex = user('alex', { role: 'admin' })
const sam = user('sam')

describe('Rolle ändern', () => {
  it('lässt den letzten aktiven Admin nicht herabstufen', async () => {
    const { services, users } = fakeServices([alex, sam])

    const result = await changeUserRole(services, {
      householdId: HOUSEHOLD,
      userId: 'alex',
      role: 'mitglied',
    })

    expect(result).toEqual({ ok: false, error: { kind: 'last-admin' } })
    expect(users[0]?.role).toBe('admin')
  })

  it('erlaubt das Herabstufen, wenn ein zweiter aktiver Admin bleibt', async () => {
    const { services, users } = fakeServices([alex, user('kim', { role: 'admin' })])

    const result = await changeUserRole(services, {
      householdId: HOUSEHOLD,
      userId: 'alex',
      role: 'mitglied',
    })

    expect(result.ok).toBe(true)
    expect(users.map((entry) => entry.role)).toEqual(['mitglied', 'admin'])
  })

  it('zählt einen deaktivierten Admin nicht mit', async () => {
    const { services } = fakeServices([alex, user('kim', { role: 'admin', isActive: false })])

    const result = await changeUserRole(services, {
      householdId: HOUSEHOLD,
      userId: 'alex',
      role: 'mitglied',
    })

    expect(result).toEqual({ ok: false, error: { kind: 'last-admin' } })
  })

  it('findet keinen Nutzer eines anderen Haushalts', async () => {
    const { services } = fakeServices([alex, user('fremd', { householdId: 'haushalt-2' })])

    const result = await changeUserRole(services, {
      householdId: HOUSEHOLD,
      userId: 'fremd',
      role: 'admin',
    })

    expect(result).toEqual({ ok: false, error: { kind: 'not-found' } })
  })
})

describe('Deaktivieren', () => {
  it('beendet alle Sitzungen und lässt sich rückgängig machen', async () => {
    const { services, users, endedSessions } = fakeServices([alex, sam])
    const target = { householdId: HOUSEHOLD, actorId: 'alex', userId: 'sam' }

    expect((await setUserActiveState(services, { ...target, isActive: false })).ok).toBe(true)
    expect(users[1]?.isActive).toBe(false)
    expect(endedSessions).toEqual(['sam'])

    expect((await setUserActiveState(services, { ...target, isActive: true })).ok).toBe(true)
    expect(users[1]?.isActive).toBe(true)
    expect(endedSessions).toEqual(['sam'])
  })

  it('nie für sich selbst und nie für den letzten aktiven Admin', async () => {
    const kim = user('kim', { role: 'admin', isActive: false })
    const { services, endedSessions } = fakeServices([alex, sam, kim])

    const self = await setUserActiveState(services, {
      householdId: HOUSEHOLD,
      actorId: 'alex',
      userId: 'alex',
      isActive: false,
    })
    const last = await setUserActiveState(services, {
      householdId: HOUSEHOLD,
      actorId: 'kim',
      userId: 'alex',
      isActive: false,
    })

    expect(self).toEqual({ ok: false, error: { kind: 'self' } })
    expect(last).toEqual({ ok: false, error: { kind: 'last-admin' } })
    expect(endedSessions).toEqual([])
  })
})

describe('Person verknüpfen und Sitzungen beenden', () => {
  it('löst eine alte Verknüpfung, wenn die Person einen neuen Nutzer bekommt', async () => {
    const { services, users } = fakeServices([alex, user('sam', { memberId: 'person-sam' })], {
      'person-sam': HOUSEHOLD,
    })

    const result = await linkUserToMember(services, {
      householdId: HOUSEHOLD,
      userId: 'alex',
      memberId: 'person-sam',
    })

    expect(result.ok).toBe(true)
    expect(users.map((entry) => entry.memberId)).toEqual(['person-sam', null])
  })

  it('lehnt eine Person eines anderen Haushalts ab und löst auf Wunsch die Verknüpfung', async () => {
    const { services, users } = fakeServices([user('sam', { memberId: 'person-sam' })], {
      'person-sam': HOUSEHOLD,
      'person-fremd': 'haushalt-2',
    })
    const target = { householdId: HOUSEHOLD, userId: 'sam' }

    expect(await linkUserToMember(services, { ...target, memberId: 'person-fremd' })).toEqual({
      ok: false,
      error: { kind: 'member-not-found' },
    })
    expect((await linkUserToMember(services, { ...target, memberId: null })).ok).toBe(true)
    expect(users[0]?.memberId).toBeNull()
  })

  it('beendet die Sitzungen nur für Nutzer des eigenen Haushalts', async () => {
    const { services, endedSessions } = fakeServices([sam, user('fremd', { householdId: 'x' })])

    expect((await endUserSessions(services, { householdId: HOUSEHOLD, userId: 'sam' })).ok).toBe(
      true,
    )
    expect(await endUserSessions(services, { householdId: HOUSEHOLD, userId: 'fremd' })).toEqual({
      ok: false,
      error: { kind: 'not-found' },
    })
    expect(endedSessions).toEqual(['sam'])
  })
})

describe('Nutzer anlegen', () => {
  const input = {
    displayName: 'Robin Beispiel',
    username: 'robin',
    role: 'mitglied' as const,
    memberId: null,
    password: null,
  }

  it('erzeugt ein Passwort, gibt es einmal zurück und speichert nur den Hash', async () => {
    const { services, created } = fakeServices([alex])

    const result = await createUser(services, { householdId: HOUSEHOLD, actorId: 'alex', input })

    expect(result).toEqual({
      ok: true,
      value: { userId: 'nutzer-1', username: 'robin', password: 'kmnp-qrst-uvwx-yz23-4567' },
    })
    expect(created[0]).toMatchObject({
      passwordHash: 'hash:kmnp-qrst-uvwx-yz23-4567',
      createdBy: 'alex',
      householdId: HOUSEHOLD,
    })
    expect(JSON.stringify(created)).not.toContain('"kmnp-qrst-uvwx-yz23-4567"')
  })

  it('prüft ein eingegebenes Passwort gegen die Regeln', async () => {
    const { services, created } = fakeServices([alex])

    const result = await createUser(services, {
      householdId: HOUSEHOLD,
      actorId: 'alex',
      input: { ...input, password: 'robin-mag-hafer' },
    })

    expect(result).toEqual({ ok: false, error: { kind: 'password', problem: 'contains-username' } })
    expect(created).toEqual([])
  })

  it('meldet einen vergebenen Benutzernamen und eine fremde Person', async () => {
    const { services } = fakeServices([alex, user('robin', { isActive: false })], {
      'person-fremd': 'haushalt-2',
    })
    const command = { householdId: HOUSEHOLD, actorId: 'alex' }

    expect(await createUser(services, { ...command, input })).toEqual({
      ok: false,
      error: { kind: 'username-taken' },
    })
    expect(
      await createUser(services, { ...command, input: { ...input, memberId: 'person-fremd' } }),
    ).toEqual({ ok: false, error: { kind: 'member-not-found' } })
  })
})

describe('Passwort zurücksetzen', () => {
  it('setzt ein neues Passwort mit dem Admin als Urheber und hebt die Sperre auf', async () => {
    const { services, resets } = fakeServices([alex, sam])

    const result = await resetUserPassword(services, {
      householdId: HOUSEHOLD,
      actorId: 'alex',
      userId: 'sam',
      password: null,
    })

    expect(result).toEqual({
      ok: true,
      value: { username: 'sam', password: 'kmnp-qrst-uvwx-yz23-4567' },
    })
    expect(resets).toEqual([
      {
        userId: 'sam',
        passwordHash: 'hash:kmnp-qrst-uvwx-yz23-4567',
        now: NOW,
        lockKeys: ['name:sam'],
        changedBy: 'alex',
      },
    ])
  })

  it('findet keinen Nutzer eines anderen Haushalts', async () => {
    const { services, resets } = fakeServices([alex, user('fremd', { householdId: 'x' })])

    const result = await resetUserPassword(services, {
      householdId: HOUSEHOLD,
      actorId: 'alex',
      userId: 'fremd',
      password: null,
    })

    expect(result).toEqual({ ok: false, error: { kind: 'not-found' } })
    expect(resets).toEqual([])
  })
})
