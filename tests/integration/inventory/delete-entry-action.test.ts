// Fehlerfassung löschen nur als Admin (#50): Die Action prüft das selbst, auch bei Direktaufruf.
// Ein Mitglied bekommt einen ruhigen Satz, und nichts wird gelöscht. Werte sind erfunden.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DeleteEntryDeps } from '../../../src/features/inventory/application/delete-entry'
import type { AccessError } from '../../../src/server/auth/guards'
import type { Result } from '../../../src/shared/lib/result'

type Access = Result<{ householdId: string }, AccessError>

const state = vi.hoisted(() => ({
  access: null as Access | null,
  erased: [] as unknown[],
}))

vi.mock('next/cache', () => ({ refresh: () => undefined }))
vi.mock('@/server/auth/guards', () => ({
  requireHouseholdAdmin: () => Promise.resolve(state.access),
}))
vi.mock('@/features/inventory/application/edit-services', () => ({
  deleteEntryDeps: (): Promise<DeleteEntryDeps> =>
    Promise.resolve({
      eraser: {
        eraseRows: (householdId, target) => {
          state.erased.push({ householdId, target })
          return Promise.resolve({ photos: [], isProductRemoved: true })
        },
      },
      storage: { delete: () => Promise.resolve() },
    }),
}))

const { deleteEntryAction } =
  await import('../../../src/features/inventory/actions/delete-entry-action')

const householdId = '11111111-1111-4111-8111-111111111111'
const target = { kind: 'product', productId: '22222222-2222-4222-8222-222222222222' }

describe('deleteEntryAction', () => {
  beforeEach(() => {
    state.erased = []
  })

  it('lehnt ein Mitglied ab und löscht nichts', async () => {
    state.access = { ok: false, error: { kind: 'forbidden' } }

    expect(await deleteEntryAction(target)).toEqual({ ok: false, message: 'Das ändert ein Admin.' })
    expect(state.erased).toEqual([])
  })

  it('löscht als Admin im eigenen Haushalt', async () => {
    state.access = { ok: true, value: { householdId } }

    expect(await deleteEntryAction(target)).toEqual({ ok: true, isProductRemoved: true })
    expect(state.erased).toEqual([{ householdId, target }])
  })

  it('lehnt eine kaputte Eingabe ab', async () => {
    state.access = { ok: true, value: { householdId } }

    expect((await deleteEntryAction({ kind: 'product', productId: 'x' })).ok).toBe(false)
    expect(state.erased).toEqual([])
  })
})
