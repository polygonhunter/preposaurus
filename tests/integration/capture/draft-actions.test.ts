import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CaptureDeps } from '../../../src/features/capture/application/capture-deps'
import { discardDraft } from '../../../src/features/capture/application/discard-draft'
import { findOpenDraft } from '../../../src/features/capture/application/find-open-draft'
import type { AccessError } from '../../../src/server/auth/guards'
import type { SessionUser } from '../../../src/server/auth/session'
import { captureDrafts, photos } from '../../../src/server/db/schema/capture'
import { createSharpPhotoProcessor } from '../../../src/server/storage/sharp-photo-processor'
import type { Result } from '../../../src/shared/lib/result'
import { insertBasics } from '../../helpers/db-fixtures'
import { createMemoryPhotoStorage } from '../../helpers/memory-photo-storage'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { FAKE_AI_ENV, insertUser, sessionUser, testJpeg, uploadRequest } from './photo-fixtures'

const state = vi.hoisted(() => ({
  session: null as Result<SessionUser, AccessError> | null,
  deps: null as CaptureDeps | null,
}))

vi.mock('@/server/auth/guards', async () =>
  (await import('./photo-fixtures')).fakeGuards(() => state.session),
)
vi.mock('@/features/capture/application/capture-deps', () => ({
  loadCaptureDeps: () => Promise.resolve(state.deps),
}))

const { saveDraftAction } = await import('../../../src/features/capture/actions/save-draft-action')
const { discardDraftAction } =
  await import('../../../src/features/capture/actions/discard-draft-action')
const { POST } = await import('../../../src/app/api/photos/route')

const DATA = {
  schritt: 'naehrwerte',
  weg: 'foto',
  verpackung: { bezeichnung: 'Linsen', behaelter: 'dose', inhaltWert: 400, inhaltEinheit: 'g' },
  mhd: [{ datum: null, anzahl: 2, ohneDatum: true }],
} as const

describe('Entwurf sichern, fortsetzen, verwerfen', () => {
  let testDb: TestDb
  let owner: SessionUser
  let housemate: SessionUser
  let productId: string
  let jpeg: Uint8Array

  const signIn = (user: SessionUser) => {
    state.session = { ok: true, value: user }
  }
  const actorOf = (user: SessionUser) => ({ userId: user.id, householdId: user.householdId ?? '' })
  const deps = () => {
    if (state.deps === null) throw new Error('deps fehlen')
    return state.deps
  }

  async function uploadPhoto(rolle = 'verpackung') {
    const response = await POST(uploadRequest(jpeg, { rolle }))
    return (await response.json()) as { fotoId: string; entwurfId: string }
  }

  beforeAll(async () => {
    testDb = await createTestDb()
    const basics = await insertBasics(testDb.db)
    productId = basics.productId
    owner = sessionUser(basics.userId, basics.householdId)
    housemate = await insertUser(testDb.db, basics.householdId)
    jpeg = await testJpeg(200, 150)
  })

  beforeEach(async () => {
    await testDb.db.delete(photos)
    await testDb.db.delete(captureDrafts)
    state.deps = {
      db: testDb.db,
      storage: createMemoryPhotoStorage(),
      processor: createSharpPhotoProcessor(),
      env: FAKE_AI_ENV,
    }
    signIn(owner)
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('legt ohne ID einen Entwurf an und sichert den Stand', async () => {
    const saved = await saveDraftAction({ daten: DATA })

    expect(saved.ok).toBe(true)
    const open = await findOpenDraft(deps(), actorOf(owner))
    expect(open?.data).toEqual(DATA)
    expect(saved.ok && open?.draftId === saved.draftId).toBe(true)
  })

  it('überschreibt beim nächsten Schritt denselben Entwurf', async () => {
    const first = await saveDraftAction({ daten: { schritt: 'verpackung' } })
    const entwurfId = first.ok ? first.draftId : ''

    const second = await saveDraftAction({ entwurfId, daten: DATA })

    expect(second).toEqual({ ok: true, draftId: entwurfId })
    expect(await testDb.db.select().from(captureDrafts)).toHaveLength(1)
  })

  it('sichert in den Entwurf, den das erste Foto angelegt hat', async () => {
    const { entwurfId, fotoId } = await uploadPhoto()

    expect(await saveDraftAction({ daten: DATA })).toEqual({ ok: true, draftId: entwurfId })
    const open = await findOpenDraft(deps(), actorOf(owner))
    expect(open?.photos).toEqual([{ id: fotoId, role: 'verpackung' }])
  })

  it('lehnt den Entwurf eines anderen Nutzers ab, auch im selben Haushalt', async () => {
    const { entwurfId } = await uploadPhoto()
    signIn(housemate)

    expect(await saveDraftAction({ entwurfId, daten: DATA })).toMatchObject({ ok: false })
    expect(await discardDraftAction({ entwurfId })).toMatchObject({ ok: false })
    expect(await findOpenDraft(deps(), actorOf(housemate))).toBeNull()
    expect(await testDb.db.select().from(photos)).toHaveLength(1)
  })

  it.each([
    ['unbekanntes Feld', { daten: { schritt: 'mhd', notiz: 'x' } }],
    ['erfundener Schritt', { daten: { schritt: 'kasse' } }],
    ['Anzahl 0', { daten: { mhd: [{ datum: '2027-09-30', anzahl: 0 }] } }],
    ['kein Datum', { daten: { mhd: [{ datum: '30.09.2027', anzahl: 1 }] } }],
    ['keine UUID', { entwurfId: 'x', daten: {} }],
    ['kein Objekt', 'daten'],
  ])('lehnt ungültige Eingaben ab und speichert nichts: %s', async (_label, input) => {
    const result = await saveDraftAction(input)

    expect(result).toEqual({
      ok: false,
      message: 'Der Stand ließ sich nicht sichern. Bitte prüfe die Eingaben.',
    })
    expect(await testDb.db.select().from(captureDrafts)).toHaveLength(0)
  })

  it('beginnt leer, wenn der gespeicherte Stand nicht mehr zum Schema passt', async () => {
    await testDb.db.insert(captureDrafts).values({
      householdId: owner.householdId ?? '',
      userId: owner.id,
      data: { schritt: 'alt', felder: [1, 2] },
    })

    expect((await findOpenDraft(deps(), actorOf(owner)))?.data).toEqual({})
  })

  it('verwirft Entwurf, Fotozeilen und danach beide Dateien je Foto', async () => {
    const { entwurfId } = await uploadPhoto()
    await uploadPhoto('mhd')

    expect(await discardDraftAction({ entwurfId })).toEqual({ ok: true, removedPhotos: 2 })
    expect(await testDb.db.select().from(captureDrafts)).toHaveLength(0)
    expect(await testDb.db.select().from(photos)).toHaveLength(0)
    expect(await deps().storage.list()).toEqual([])
    expect(await findOpenDraft(deps(), actorOf(owner))).toBeNull()
  })

  it('lässt feste Fotos beim Verwerfen stehen', async () => {
    const { entwurfId, fotoId } = await uploadPhoto()
    await testDb.db.update(photos).set({ status: 'fest', productId }).where(eq(photos.id, fotoId))

    expect(await discardDraftAction({ entwurfId })).toEqual({ ok: true, removedPhotos: 0 })
    const [row] = await testDb.db.select().from(photos)
    expect(row?.draftId).toBeNull()
    expect(await deps().storage.list()).toHaveLength(2)
  })

  it('löscht erst die DB: scheitert eine Datei, ist der Entwurf trotzdem weg', async () => {
    const { entwurfId, fotoId } = await uploadPhoto()
    const failingStorage = { ...deps().storage, delete: () => Promise.reject(new Error('NAS weg')) }

    const result = await discardDraft(
      { db: testDb.db, storage: failingStorage },
      { actor: actorOf(owner), draftId: entwurfId },
    )

    expect(result).toEqual({ ok: true, value: { removedPhotos: 1, leftoverPhotoIds: [fotoId] } })
    expect(await testDb.db.select().from(captureDrafts)).toHaveLength(0)
  })

  it('meldet einen schon verworfenen Entwurf ruhig als nicht mehr vorhanden', async () => {
    const { entwurfId } = await uploadPhoto()
    await discardDraftAction({ entwurfId })

    expect(await discardDraftAction({ entwurfId })).toEqual({
      ok: false,
      message: 'Diese Erfassung gibt es nicht mehr. Bitte neu beginnen.',
    })
  })

  it('verlangt eine Anmeldung', async () => {
    state.session = { ok: false, error: { kind: 'unauthenticated' } }

    expect(await saveDraftAction({ daten: DATA })).toEqual({
      ok: false,
      message: 'Bitte melde dich an.',
    })
    expect(await discardDraftAction({ entwurfId: crypto.randomUUID() })).toMatchObject({
      ok: false,
    })
  })
})
