import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildHouseholdSettings } from '../../../db/seeds/factories'
import type { CaptureDeps } from '../../../src/features/capture/application/capture-deps'
import type { AccessError } from '../../../src/server/auth/guards'
import type { SessionUser } from '../../../src/server/auth/session'
import { aiCalls, captureDrafts, photos } from '../../../src/server/db/schema/capture'
import { householdSettings } from '../../../src/server/db/schema/household'
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

const { POST: upload } = await import('../../../src/app/api/photos/route')
const { POST: recognize } = await import('../../../src/app/api/recognize/route')

const recognizeRequest = (body: unknown) =>
  new Request('https://preposaurus.test/api/recognize', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })

describe('POST /api/recognize', () => {
  let testDb: TestDb
  let owner: SessionUser
  let housemate: SessionUser
  let householdId: string
  let productId: string
  let jpeg: Uint8Array

  const signIn = (user: SessionUser) => {
    state.session = { ok: true, value: user }
  }
  const setAiEnabled = (isAiEnabled: boolean) =>
    testDb.db
      .update(householdSettings)
      .set({ isAiEnabled })
      .where(eq(householdSettings.householdId, householdId))

  async function uploadPhoto(rolle: string) {
    const response = await upload(uploadRequest(jpeg, { rolle }))
    return ((await response.json()) as { fotoId: string }).fotoId
  }

  async function recognizeJson(body: unknown) {
    const response = await recognize(recognizeRequest(body))
    return { status: response.status, body: (await response.json()) as Record<string, unknown> }
  }

  beforeAll(async () => {
    testDb = await createTestDb()
    const basics = await insertBasics(testDb.db)
    ;({ householdId, productId } = basics)
    await testDb.db
      .insert(householdSettings)
      .values(buildHouseholdSettings({ householdId, isAiEnabled: true }))
    owner = sessionUser(basics.userId, householdId)
    housemate = await insertUser(testDb.db, householdId)
    jpeg = await testJpeg(200, 150)
  })

  beforeEach(async () => {
    await testDb.db.delete(aiCalls)
    await testDb.db.delete(photos)
    await testDb.db.delete(captureDrafts)
    await setAiEnabled(true)
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

  it('erkennt die Verpackung mit Fake-KI und protokolliert den Aufruf', async () => {
    const fotoId = await uploadPhoto('verpackung')

    const { status, body } = await recognizeJson({ fotoId })

    expect(status).toBe(200)
    expect(body).toMatchObject({ role: 'verpackung', packaging: { name: null, content: null } })
    const calls = await testDb.db.select().from(aiCalls)
    expect(calls).toMatchObject([{ role: 'verpackung', photoId: fotoId, isSuccess: true }])
  })

  it('macht beim unlesbaren MHD den Zweitversuch, beide stehen im Protokoll', async () => {
    const fotoId = await uploadPhoto('mhd')

    const { body } = await recognizeJson({ fotoId })

    expect(body).toMatchObject({ role: 'mhd', bestBefore: { bestBefore: null } })
    const attempts = (await testDb.db.select().from(aiCalls)).map((call) => call.attempt).sort()
    expect(attempts).toEqual([1, 2])
  })

  it('liest die Nährwerttabelle und lehnt eine Schätzung über diesen Weg ab', async () => {
    const fotoId = await uploadPhoto('naehrwerte')

    const read = await recognizeJson({ fotoId })
    const estimate = await recognizeJson({ fotoId, schaetzung: { bezeichnung: 'Linsen' } })

    expect(read.body).toMatchObject({ role: 'naehrwerte', nutrition: { source: 'label' } })
    expect(estimate.status).toBe(400)
  })

  it('ruft bei ausgeschalteter KI keinen Adapter auf', async () => {
    const fotoId = await uploadPhoto('verpackung')
    await setAiEnabled(false)

    const { status, body } = await recognizeJson({ fotoId })

    expect(status).toBe(503)
    expect(body['grund']).toBe('ai-disabled')
    expect(await testDb.db.select().from(aiCalls)).toEqual([])
  })

  it('erkennt nur Fotos aus dem eigenen Entwurf', async () => {
    const fotoId = await uploadPhoto('verpackung')
    signIn(housemate)

    expect((await recognizeJson({ fotoId })).status).toBe(404)
    expect(await testDb.db.select().from(aiCalls)).toEqual([])
  })

  it('erkennt keine festen Fotos mehr', async () => {
    const fotoId = await uploadPhoto('verpackung')
    await testDb.db.update(photos).set({ status: 'fest', productId }).where(eq(photos.id, fotoId))

    expect((await recognizeJson({ fotoId })).status).toBe(404)
  })

  it.each([
    ['kein JSON', '{fotoId:'],
    ['keine UUID', { fotoId: 'x' }],
    ['unbekanntes Feld', { fotoId: crypto.randomUUID(), rolle: 'mhd' }],
  ])('lehnt ab: %s', async (_label, body) => {
    expect((await recognizeJson(body)).status).toBe(400)
  })

  it('verlangt eine Anmeldung', async () => {
    state.session = { ok: false, error: { kind: 'unauthenticated' } }

    expect((await recognizeJson({ fotoId: crypto.randomUUID() })).status).toBe(401)
  })
})
