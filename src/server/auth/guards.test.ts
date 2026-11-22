import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requireAdmin, requireHouseholdUser, requireUser } from './guards'
import { readSession, type SessionUser } from './session'

vi.mock('next/headers', () => ({ headers: () => Promise.resolve(new Headers()) }))
vi.mock('./get-auth', () => ({ getAuth: () => Promise.resolve({}) }))
vi.mock('./session', () => ({ readSession: vi.fn() }))

const member: SessionUser = {
  id: 'nutzer-1',
  name: 'Sam',
  username: 'sam',
  role: 'mitglied',
  householdId: 'haushalt-1',
}

const signedInAs = (user: SessionUser | null) => {
  vi.mocked(readSession).mockResolvedValue(user)
}

describe('Guards', () => {
  beforeEach(() => {
    vi.mocked(readSession).mockReset()
  })

  it('melden ohne Sitzung „nicht angemeldet“', async () => {
    signedInAs(null)

    expect(await requireUser()).toEqual({ ok: false, error: { kind: 'unauthenticated' } })
    expect(await requireAdmin()).toEqual({ ok: false, error: { kind: 'unauthenticated' } })
    expect(await requireHouseholdUser()).toEqual({ ok: false, error: { kind: 'unauthenticated' } })
  })

  it('requireAdmin lässt nur Admins durch', async () => {
    signedInAs(member)
    expect(await requireAdmin()).toEqual({ ok: false, error: { kind: 'forbidden' } })

    signedInAs({ ...member, role: 'admin' })
    expect(await requireAdmin()).toEqual({ ok: true, value: { ...member, role: 'admin' } })
  })

  it('requireHouseholdUser liefert den Nutzer mit seinem Haushalt', async () => {
    signedInAs(member)

    const result = await requireHouseholdUser()

    expect(result).toEqual({ ok: true, value: member })
  })

  it('requireHouseholdUser sperrt einen Nutzer ohne Haushalt aus, auch einen Admin', async () => {
    signedInAs({ ...member, role: 'admin', householdId: null })

    expect(await requireHouseholdUser()).toEqual({ ok: false, error: { kind: 'forbidden' } })
  })
})
