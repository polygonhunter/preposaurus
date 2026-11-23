import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CaptureDeps } from '../../../src/features/capture/application/capture-deps'
import { cleanUpCaptures } from '../../../src/features/capture/application/clean-up-captures'
import { createStock } from '../../../src/features/capture/application/create-stock'
import { createStockWriteRepository } from '../../../src/features/capture/data/stock-write-repository'
import { createStockSchema } from '../../../src/features/capture/schemas/stock'
import type { AccessError } from '../../../src/server/auth/guards'
import type { SessionUser } from '../../../src/server/auth/session'
import { captureDrafts, photos } from '../../../src/server/db/schema/capture'
import { parsePhotoKey } from '../../../src/server/storage/photo-key'
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

const { POST } = await import('../../../src/app/api/photos/route')

const HOUR_MS = 3_600_000
const DAY_MS = 24 * HOUR_MS

describe('Bestätigen aus dem Entwurf und Aufräumen (#66)', () => {
  let testDb: TestDb
  let owner: SessionUser
  let housemate: SessionUser
  let productId: string
  let jpeg: Uint8Array
  let clock: Date

  const deps = () => {
    if (state.deps === null) throw new Error('deps fehlen')
    return state.deps
  }

  async function uploadPhoto(rolle = 'verpackung') {
    const response = await POST(uploadRequest(jpeg, { rolle }))
    return (await response.json()) as { fotoId: string; entwurfId: string }
  }

  function confirm(draftId: string, by: SessionUser = owner) {
    const draft = createStockSchema.parse({
      captureId: draftId,
      method: 'photo',
      draftId,
      product: { kind: 'existing', productId },
      units: [{ bestBefore: { date: '2027-09-30', precision: 'day' }, count: 2 }],
    })
    return createStock(
      { writer: createStockWriteRepository(testDb.db), now: () => clock },
      { householdId: by.householdId ?? '', userId: by.id, draft },
    )
  }

  const photoRows = () => testDb.db.select().from(photos)
  const fileKeys = async () => (await deps().storage.list()).map((file) => file.key).sort()

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
    clock = new Date('2026-11-23T10:00:00Z')
    state.deps = {
      db: testDb.db,
      storage: createMemoryPhotoStorage(() => clock),
      processor: createSharpPhotoProcessor(),
      env: FAKE_AI_ENV,
    }
    state.session = { ok: true, value: owner }
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('macht beim Speichern die Fotos fest, hängt sie ans Produkt und löscht den Entwurf', async () => {
    const { entwurfId } = await uploadPhoto()
    await uploadPhoto('mhd')

    const result = await confirm(entwurfId)

    expect(result).toMatchObject({ ok: true, value: { unitCount: 2, isReplay: false } })
    const rows = await photoRows()
    expect(rows.map((row) => [row.status, row.productId, row.draftId])).toEqual([
      ['fest', productId, null],
      ['fest', productId, null],
    ])
    expect(await testDb.db.select().from(captureDrafts)).toHaveLength(0)
    expect(await fileKeys()).toHaveLength(4)
  })

  it('legt beim doppelten Bestätigen nichts doppelt an und lässt die Fotos stehen', async () => {
    const { entwurfId } = await uploadPhoto()

    await confirm(entwurfId)
    const second = await confirm(entwurfId)

    expect(second).toMatchObject({ ok: true, value: { isReplay: true, unitCount: 2 } })
    expect((await photoRows()).map((row) => row.status)).toEqual(['fest'])
  })

  it('fasst den Entwurf eines anderen Nutzers nicht an', async () => {
    const { entwurfId } = await uploadPhoto()

    await confirm(entwurfId, housemate)

    expect((await photoRows()).map((row) => row.status)).toEqual(['entwurf'])
    expect(await testDb.db.select().from(captureDrafts)).toHaveLength(1)
  })

  it('räumt Entwürfe nach 7 Tagen samt Fotos und Dateien weg, frische bleiben', async () => {
    const old = await uploadPhoto()
    await testDb.db
      .update(captureDrafts)
      .set({ updatedAt: new Date(clock.getTime() - 8 * DAY_MS) })
      .where(eq(captureDrafts.id, old.entwurfId))
    await testDb.db
      .update(photos)
      .set({ createdAt: new Date(clock.getTime() - 8 * DAY_MS) })
      .where(eq(photos.id, old.fotoId))
    state.session = { ok: true, value: housemate }
    const fresh = await uploadPhoto()

    const result = await cleanUpCaptures(deps(), clock)

    expect(result).toEqual({ removedDrafts: 1, removedPhotos: 1, removedOrphanFiles: 0 })
    expect((await photoRows()).map((row) => row.id)).toEqual([fresh.fotoId])
    expect(await fileKeys()).toHaveLength(2)
  })

  it('zählt einen Entwurf mit frischem Foto nicht als alt', async () => {
    const { entwurfId } = await uploadPhoto()
    await testDb.db
      .update(captureDrafts)
      .set({ updatedAt: new Date(clock.getTime() - 8 * DAY_MS) })
      .where(eq(captureDrafts.id, entwurfId))

    expect(await cleanUpCaptures(deps(), clock)).toMatchObject({ removedDrafts: 0 })
  })

  it('entfernt Entwurfsfotos ohne Entwurf samt beiden Dateien', async () => {
    const { fotoId } = await uploadPhoto()
    await testDb.db.update(photos).set({ draftId: null }).where(eq(photos.id, fotoId))

    const result = await cleanUpCaptures(deps(), clock)

    expect(result).toMatchObject({ removedPhotos: 1 })
    expect(await photoRows()).toEqual([])
    expect(await fileKeys()).toEqual([])
  })

  it('lässt Bild und Vorschau eines festen Fotos auch nach 24 Stunden stehen', async () => {
    const { entwurfId } = await uploadPhoto()
    await confirm(entwurfId)
    const filesBefore = await fileKeys()
    clock = new Date(clock.getTime() + 30 * DAY_MS)

    const result = await cleanUpCaptures(deps(), clock)

    expect(result.removedOrphanFiles).toBe(0)
    expect(await fileKeys()).toEqual(filesBefore)
    expect(filesBefore.some((key) => key.endsWith('-thumbnail.jpg'))).toBe(true)
  })

  it('löscht Dateien ohne DB-Zeile erst nach 24 Stunden', async () => {
    const save = (name: string) => {
      const key = parsePhotoKey(`${owner.householdId ?? ''}/${name}`)
      if (key === null) throw new Error('Schlüssel ungültig')
      return deps().storage.save(key, { data: jpeg, mimeType: 'image/jpeg' })
    }
    await save(`${randomUUID()}-full.jpg`)
    clock = new Date(clock.getTime() + 25 * HOUR_MS)
    await save(`${randomUUID()}-full.jpg`)

    const result = await cleanUpCaptures(deps(), clock)

    expect(result.removedOrphanFiles).toBe(1)
    expect(await fileKeys()).toHaveLength(1)
  })
})
