import { describe, expect, it } from 'vitest'
import {
  changeRole,
  isLastActiveAdmin,
  linkMember,
  setUserActive,
  type AppUser,
} from './user-rules'

const user = (id: string, overrides: Partial<AppUser> = {}): AppUser => ({
  id,
  role: 'member',
  isActive: true,
  memberId: null,
  ...overrides,
})

const alex = user('alex', { role: 'admin', memberId: 'm-alex' })
const kim = user('kim', { memberId: 'm-kim' })
const sam = user('sam', { role: 'admin', isActive: false })
const team = [alex, kim, sam]

const lastAdmin = { ok: false, error: { kind: 'last-admin' } }
const notFound = { ok: false, error: { kind: 'not-found' } }

describe('isLastActiveAdmin', () => {
  it('erkennt den einzigen aktiven Admin, ein deaktivierter Admin zählt nicht', () => {
    expect(isLastActiveAdmin(team, 'alex')).toBe(true)
    expect(isLastActiveAdmin(team, 'sam')).toBe(false)
    expect(isLastActiveAdmin(team, 'kim')).toBe(false)
  })

  it('ist bei zwei aktiven Admins für keinen wahr', () => {
    const twoAdmins = [alex, user('kim', { role: 'admin' })]
    expect(isLastActiveAdmin(twoAdmins, 'alex')).toBe(false)
  })
})

describe('changeRole', () => {
  it('stuft den letzten aktiven Admin nicht herab', () => {
    expect(changeRole(team, 'alex', 'member')).toEqual(lastAdmin)
  })

  it('macht ein Mitglied zum Admin, danach darf der alte Admin herabgestuft werden', () => {
    const promoted = changeRole(team, 'kim', 'admin')
    if (!promoted.ok) throw new Error('unerwartet')

    expect(promoted.value.find((entry) => entry.id === 'kim')?.role).toBe('admin')
    expect(changeRole(promoted.value, 'alex', 'member').ok).toBe(true)
  })

  it('erlaubt dem letzten Admin, Admin zu bleiben', () => {
    expect(changeRole(team, 'alex', 'admin').ok).toBe(true)
  })

  it('meldet einen unbekannten Nutzer', () => {
    expect(changeRole(team, 'niemand', 'admin')).toEqual(notFound)
  })
})

describe('setUserActive', () => {
  it('deaktiviert den letzten aktiven Admin nicht', () => {
    expect(setUserActive(team, 'alex', false)).toEqual(lastAdmin)
  })

  it('deaktiviert ein Mitglied und aktiviert einen Admin wieder', () => {
    const deactivated = setUserActive(team, 'kim', false)
    const reactivated = setUserActive(team, 'sam', true)

    expect(deactivated.ok && deactivated.value[1]?.isActive).toBe(false)
    expect(reactivated.ok && reactivated.value[2]?.isActive).toBe(true)
  })
})

describe('linkMember', () => {
  it('löst die alte Verknüpfung, wenn ein Mitglied neu verknüpft wird', () => {
    const result = linkMember(team, 'kim', 'm-alex')
    if (!result.ok) throw new Error('unerwartet')

    expect(result.value.map((entry) => [entry.id, entry.memberId])).toEqual([
      ['alex', null],
      ['kim', 'm-alex'],
      ['sam', null],
    ])
  })

  it('löst eine Verknüpfung mit null, ohne andere zu ändern', () => {
    const result = linkMember(team, 'alex', null)
    expect(result.ok && result.value.map((entry) => entry.memberId)).toEqual([null, 'm-kim', null])
  })

  it('meldet einen unbekannten Nutzer', () => {
    expect(linkMember(team, 'niemand', 'm-alex')).toEqual(notFound)
  })
})
