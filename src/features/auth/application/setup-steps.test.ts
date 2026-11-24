import { describe, expect, it } from 'vitest'
import type { SetupProgressRepository } from '../data/setup-progress-repository'
import { completeSetupStep, findOpenSetupStep, readOpenSetup } from './setup-steps'

type StoredSetupProgress = NonNullable<Awaited<ReturnType<SetupProgressRepository['readForUser']>>>

const NOW = new Date('2026-11-23T09:00:00Z')
const ADMIN = 'admin-1'
const MEMBER = 'mitglied-1'

// Fake wie das echte Repository: Zurückgehen senkt den Schritt nicht, nach dem Abschluss ändert
// sich nichts mehr.
function fakeDeps(start: Partial<StoredSetupProgress> = {}) {
  let stored: StoredSetupProgress = {
    householdId: 'haushalt-1',
    lastDoneStep: 1,
    completedAt: null,
    isSetupAdmin: true,
    ...start,
  }
  const raise = (step: number) => Math.max(stored.lastDoneStep ?? 0, step)
  const repository: SetupProgressRepository = {
    readForUser: (userId) =>
      Promise.resolve({ ...stored, isSetupAdmin: stored.isSetupAdmin && userId === ADMIN }),
    markDone: ({ step }) => {
      if (stored.completedAt === null) stored = { ...stored, lastDoneStep: raise(step) }
      return Promise.resolve()
    },
    complete: ({ step, now }) => {
      if (stored.completedAt === null) {
        stored = { ...stored, lastDoneStep: raise(step), completedAt: now }
      }
      return Promise.resolve()
    },
  }
  return { deps: { repository, now: () => NOW }, current: () => stored }
}

const onPhone = { userId: ADMIN, showsHomeStep: true }
const onComputer = { userId: ADMIN, showsHomeStep: false }

describe('Folgeschritte der Einrichtung', () => {
  it('führt nach dem Konto zu den Mitgliedern', async () => {
    const { deps } = fakeDeps()

    expect(await findOpenSetupStep(deps, onComputer)).toBe('mitglieder')
  })

  it('Mitglieder, Ziel und Foto-Erkennung am PC, danach ist die Einrichtung abgeschlossen', async () => {
    const { deps, current } = fakeDeps()

    expect(await completeSetupStep(deps, { ...onComputer, step: 'mitglieder' })).toEqual({
      ok: true,
      value: 'ziel',
    })
    expect(current()).toMatchObject({ lastDoneStep: 2, completedAt: null })
    expect(await completeSetupStep(deps, { ...onComputer, step: 'ziel' })).toEqual({
      ok: true,
      value: 'foto-erkennung',
    })
    expect(current()).toMatchObject({ lastDoneStep: 3, completedAt: null })
    expect(await completeSetupStep(deps, { ...onComputer, step: 'foto-erkennung' })).toEqual({
      ok: true,
      value: null,
    })
    expect(current()).toMatchObject({ lastDoneStep: 4, completedAt: NOW })
    expect(await findOpenSetupStep(deps, onComputer)).toBeNull()
  })

  it('im iPhone-Safari kommt nach der Foto-Erkennung der Home-Bildschirm, der abschließt', async () => {
    const { deps, current } = fakeDeps({ lastDoneStep: 3 })

    expect(await completeSetupStep(deps, { ...onPhone, step: 'foto-erkennung' })).toEqual({
      ok: true,
      value: 'home-bildschirm',
    })
    expect(current().completedAt).toBeNull()
    expect(await findOpenSetupStep(deps, onPhone)).toBe('home-bildschirm')
    await completeSetupStep(deps, { ...onPhone, step: 'home-bildschirm' })
    expect(current()).toMatchObject({ lastDoneStep: 5, completedAt: NOW })
  })

  it('wer abbricht, landet beim offenen Schritt, auch nach Zurückblättern', async () => {
    const { deps } = fakeDeps({ lastDoneStep: 2 })

    await completeSetupStep(deps, { ...onComputer, step: 'mitglieder' })

    expect(await findOpenSetupStep(deps, onComputer)).toBe('ziel')
  })

  it('andere Nutzer sehen keine Schritte und können keinen erledigen', async () => {
    const { deps, current } = fakeDeps()
    const member = { userId: MEMBER, showsHomeStep: false }

    expect(await findOpenSetupStep(deps, member)).toBeNull()
    expect(await readOpenSetup(deps, member)).toEqual({
      ok: false,
      error: { kind: 'setup-closed' },
    })
    expect(await completeSetupStep(deps, { ...member, step: 'mitglieder' })).toEqual({
      ok: false,
      error: { kind: 'setup-closed' },
    })
    expect(current().lastDoneStep).toBe(1)
  })

  it('nach dem Abschluss und bei Haushalten ohne Einrichtung ist nichts offen', async () => {
    const done = fakeDeps({ completedAt: NOW, lastDoneStep: 4 })
    const seeded = fakeDeps({ lastDoneStep: null })

    expect(await findOpenSetupStep(done.deps, onPhone)).toBeNull()
    expect((await readOpenSetup(done.deps, onPhone)).ok).toBe(false)
    expect(await findOpenSetupStep(seeded.deps, onPhone)).toBeNull()
  })

  it('erlaubt die Seiten der Schritte, solange offen, mit dem offenen Schritt', async () => {
    const { deps } = fakeDeps({ lastDoneStep: 4 })

    expect(await readOpenSetup(deps, onPhone)).toEqual({
      ok: true,
      value: { householdId: 'haushalt-1', openStep: 'home-bildschirm' },
    })
    expect(await readOpenSetup(deps, onComputer)).toEqual({
      ok: true,
      value: { householdId: 'haushalt-1', openStep: null },
    })
  })
})
