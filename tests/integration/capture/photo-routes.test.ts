import { eq } from 'drizzle-orm'
import sharp from 'sharp'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CaptureDeps } from '../../../src/features/capture/application/capture-deps'
import type { AccessError } from '../../../src/server/auth/guards'
import type { SessionUser } from '../../../src/server/auth/session'
import { captureDrafts, photos } from '../../../src/server/db/schema/capture'
import { MAX_UPLOAD_BYTES } from '../../../src/server/storage/photo-processor'
import type { PhotoKey } from '../../../src/server/storage/photo-key'
import { createSharpPhotoProcessor } from '../../../src/server/storage/sharp-photo-processor'
import type { Result } from '../../../src/shared/lib/result'
import { insertBasics } from '../../helpers/db-fixtures'
import { createMemoryPhotoStorage } from '../../helpers/memory-photo-storage'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { insertUser, photoRequest, sessionUser, testJpeg, uploadRequest } from './photo-fixtures'

const state = vi.hoisted(() => ({
  session: null as Result<SessionUser, AccessError> | null,
  deps: null as CaptureDeps | null,
}))

vi.mock('@/server/auth/guards', () => ({
  requireUser: () => Promise.resolve(state.session),
}))
vi.mock('@/features/capture/application/capture-deps', () => ({
  loadCaptureDeps: () => Promise.resolve(state.deps),
}))

const { POST } = await import('../../../src/app/api/photos/route')
const { GET } = await import('../../../src/app/api/photos/[id]/route')

describe('Foto-Routen', () => {
  let testDb: TestDb
  let owner: SessionUser
  let housemate: SessionUser
  let stranger: SessionUser
  let productId: string
  let jpeg: Uint8Array

  const signIn = (user: SessionUser) => {
    state.session = { ok: true, value: user }
  }

  async function upload(query: Record<string, string> = { rolle: 'verpackung' }) {
    const response = await POST(uploadRequest(jpeg, query))
    return { response, body: (await response.json()) as Record<string, string> }
  }

  beforeAll(async () => {
    testDb = await createTestDb()
    const basics = await insertBasics(testDb.db)
    productId = basics.productId
    owner = sessionUser(basics.userId, basics.householdId)
    housemate = await insertUser(testDb.db, basics.householdId)
    stranger = await insertUser(testDb.db)
    jpeg = await testJpeg()
  })

  beforeEach(async () => {
    await testDb.db.delete(photos)
    await testDb.db.delete(captureDrafts)
    state.deps = {
      db: testDb.db,
      storage: createMemoryPhotoStorage(),
      processor: createSharpPhotoProcessor(),
    }
    signIn(owner)
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('legt beim ersten Foto den Entwurf an und hängt weitere Fotos daran', async () => {
    const first = await upload()
    const second = await upload({ rolle: 'mhd' })

    expect(first.response.status).toBe(201)
    expect(second.body['entwurfId']).toBe(first.body['entwurfId'])
    const rows = await testDb.db.select().from(photos)
    expect(rows).toHaveLength(2)
    expect(rows.every((row) => row.status === 'entwurf' && row.userId === owner.id)).toBe(true)
    expect(await testDb.db.select().from(captureDrafts)).toHaveLength(1)
  })

  it('legt bei gleichzeitigen ersten Fotos nur einen Entwurf an', async () => {
    const results = await Promise.all([upload(), upload(), upload()])

    expect(new Set(results.map(({ body }) => body['entwurfId'])).size).toBe(1)
    expect(await testDb.db.select().from(captureDrafts)).toHaveLength(1)
  })

  it('speichert Bild und Vorschau verkleinert, ohne EXIF', async () => {
    const { body } = await upload()
    const fotoId = body['fotoId'] ?? ''

    const full = await GET(...photoRequest(fotoId))
    const thumbnail = await GET(...photoRequest(fotoId, 'vorschau'))

    expect(full.status).toBe(200)
    const fullMeta = await sharp(new Uint8Array(await full.arrayBuffer())).metadata()
    const thumbMeta = await sharp(new Uint8Array(await thumbnail.arrayBuffer())).metadata()
    expect(fullMeta.width).toBe(800)
    expect(thumbMeta.width).toBe(400)
    expect(fullMeta.exif).toBeUndefined()
  })

  it('liefert mit Cache- und Sicherheits-Headern aus', async () => {
    const { body } = await upload()

    const response = await GET(...photoRequest(body['fotoId'] ?? ''))

    expect(Object.fromEntries(response.headers)).toMatchObject({
      'content-type': 'image/jpeg',
      'cache-control': 'private, max-age=604800, immutable',
      'x-content-type-options': 'nosniff',
      'cross-origin-resource-policy': 'same-origin',
      'content-security-policy': "default-src 'none'; sandbox",
    })
  })

  it('zeigt ein Entwurfsfoto nur dem eigenen Nutzer, nicht dem Haushalt', async () => {
    const { body } = await upload()
    const fotoId = body['fotoId'] ?? ''

    signIn(housemate)
    expect((await GET(...photoRequest(fotoId))).status).toBe(404)
    signIn(stranger)
    expect((await GET(...photoRequest(fotoId))).status).toBe(404)
  })

  it('zeigt ein festes Foto dem ganzen Haushalt, keinem fremden', async () => {
    const { body } = await upload()
    const fotoId = body['fotoId'] ?? ''
    await testDb.db.update(photos).set({ status: 'fest', productId }).where(eq(photos.id, fotoId))

    signIn(housemate)
    expect((await GET(...photoRequest(fotoId))).status).toBe(200)
    signIn(stranger)
    expect((await GET(...photoRequest(fotoId))).status).toBe(404)
  })

  it('verbirgt ein Entwurfsfoto, sobald sein Entwurf weg ist', async () => {
    const { body } = await upload()
    await testDb.db.delete(captureDrafts)

    expect((await GET(...photoRequest(body['fotoId'] ?? ''))).status).toBe(404)
  })

  it.each(['keine-uuid', '00000000-0000-4000-8000-000000000000'])(
    'antwortet bei unbekannter ID %s mit 404',
    async (id) => {
      expect((await GET(...photoRequest(id))).status).toBe(404)
    },
  )

  it('lehnt einen fremden Entwurf ab und lässt keine Datei zurück', async () => {
    const { body } = await upload()
    signIn(stranger)

    const foreign = await upload({ rolle: 'mhd', entwurf: body['entwurfId'] ?? '' })

    expect(foreign.response.status).toBe(404)
    expect(await testDb.db.select().from(photos)).toHaveLength(1)
    expect(await state.deps?.storage.list()).toHaveLength(2)
  })

  it('lehnt ein zu großes Foto mit 413 ab, ohne etwas zu speichern', async () => {
    const tooLarge = new Uint8Array(MAX_UPLOAD_BYTES + 1)
    tooLarge.set(jpeg.subarray(0, 3))

    const response = await POST(uploadRequest(tooLarge, { rolle: 'verpackung' }))

    expect(response.status).toBe(413)
    expect(await testDb.db.select().from(captureDrafts)).toHaveLength(0)
  })

  it.each([
    ['kein Bild', new TextEncoder().encode('<svg onload="x"></svg>'), 415],
    ['leer', new Uint8Array(0), 400],
    ['beschädigtes JPEG', new Uint8Array([0xff, 0xd8, 0xff, 0, 1, 2, 3]), 422],
  ])('lehnt ab: %s', async (_label, data, status) => {
    const response = await POST(uploadRequest(data, { rolle: 'verpackung' }))

    expect(response.status).toBe(status)
    expect(await state.deps?.storage.list()).toEqual([])
  })

  it.each([{}, { rolle: 'selfie' }, { rolle: 'mhd', entwurf: 'x' }])(
    'lehnt eine ungültige Query ab (%o)',
    async (query) => {
      expect((await POST(uploadRequest(jpeg, query))).status).toBe(400)
    },
  )

  it('verlangt eine Anmeldung', async () => {
    state.session = { ok: false, error: { kind: 'unauthenticated' } }

    expect((await POST(uploadRequest(jpeg, { rolle: 'mhd' }))).status).toBe(401)
    expect((await GET(...photoRequest('00000000-0000-4000-8000-000000000000'))).status).toBe(401)
  })

  it('lehnt Nutzer ohne Haushalt ab', async () => {
    signIn(sessionUser(owner.id, null))

    expect((await POST(uploadRequest(jpeg, { rolle: 'mhd' }))).status).toBe(403)
  })

  it('lehnt Uploads von fremden Seiten ab', async () => {
    const request = uploadRequest(jpeg, { rolle: 'mhd' }, { 'sec-fetch-site': 'cross-site' })

    expect((await POST(request)).status).toBe(403)
  })

  it('räumt beide Dateien weg, wenn die DB-Zeile scheitert', async () => {
    const storage = createMemoryPhotoStorage()
    const failingDb = { transaction: () => Promise.reject(new Error('DB weg')) }
    state.deps = { db: failingDb as never, storage, processor: createSharpPhotoProcessor() }

    await expect(POST(uploadRequest(jpeg, { rolle: 'mhd' }))).rejects.toThrow('DB weg')
    expect(await storage.list()).toEqual([])
  })

  it('legt die Dateien unter dem Haushalt ab und merkt sich den Pfad', async () => {
    const { body } = await upload()
    const [row] = await testDb.db.select().from(photos)
    const keys = (await state.deps?.storage.list())?.map((file) => file.key)

    expect(row?.path).toBe(`${owner.householdId ?? ''}/${body['fotoId'] ?? ''}-full.jpg`)
    expect(keys?.sort()).toEqual(
      [row?.path, row?.path.replace('-full', '-thumbnail')].sort() as PhotoKey[],
    )
  })
})
