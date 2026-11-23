// Schätzung auf Wahl über die Action (#124) und der Weg, den „Neu“ öffnet (UX §8.5), gegen PGlite
// mit Fake-KI. Der Fake schätzt ohne feste Antwort nichts: Es bleibt bei „Datum fehlt“ bzw. beim
// Richtwert, nie ein ausgedachter Wert.
import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildCapture, buildHouseholdSettings } from '../../../db/seeds/factories'
import type { CaptureDeps } from '../../../src/features/capture/application/capture-deps'
import { chooseCaptureWay } from '../../../src/features/capture/application/choose-capture-way'
import type { AccessError } from '../../../src/server/auth/guards'
import type { SessionUser } from '../../../src/server/auth/session'
import { aiCalls, captureDrafts, photos } from '../../../src/server/db/schema/capture'
import { captures } from '../../../src/server/db/schema/confirmed-captures'
import { householdSettings } from '../../../src/server/db/schema/household'
import { units } from '../../../src/server/db/schema/inventory'
import { createSharpPhotoProcessor } from '../../../src/server/storage/sharp-photo-processor'
import type { Result } from '../../../src/shared/lib/result'
import { insertBasics } from '../../helpers/db-fixtures'
import { createMemoryPhotoStorage } from '../../helpers/memory-photo-storage'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { FAKE_AI_ENV, sessionUser, testJpeg, uploadRequest } from './photo-fixtures'

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
const { requestEstimateAction } =
  await import('../../../src/features/capture/actions/request-estimate-action')

describe('Schätzung auf Wahl und Weg der Erfassung', () => {
  let testDb: TestDb
  let owner: SessionUser
  let householdId: string
  let jpeg: Uint8Array

  const setAiEnabled = (isAiEnabled: boolean) =>
    testDb.db
      .update(householdSettings)
      .set({ isAiEnabled })
      .where(eq(householdSettings.householdId, householdId))

  async function uploadPhoto(rolle: string) {
    const response = await upload(uploadRequest(jpeg, { rolle }))
    return ((await response.json()) as { fotoId: string }).fotoId
  }

  const estimate = (fotoId: string, ziel: 'mhd' | 'naehrwerte') =>
    requestEstimateAction({ fotoId, ziel, lebensmittelartId: null, bezeichnung: 'Linsen' })

  beforeAll(async () => {
    testDb = await createTestDb()
    const basics = await insertBasics(testDb.db)
    householdId = basics.householdId
    await testDb.db
      .insert(householdSettings)
      .values(buildHouseholdSettings({ householdId, isAiEnabled: true }))
    owner = sessionUser(basics.userId, householdId)
    jpeg = await testJpeg(200, 150)
  })

  beforeEach(async () => {
    await testDb.db.delete(aiCalls)
    await testDb.db.delete(photos)
    await testDb.db.delete(captureDrafts)
    await setAiEnabled(true)
    state.session = { ok: true, value: owner }
    state.deps = {
      db: testDb.db,
      storage: createMemoryPhotoStorage(),
      processor: createSharpPhotoProcessor(),
      env: FAKE_AI_ENV,
    }
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('schätzt nur mit Verpackungsfoto und erfindet ohne Antwort nichts', async () => {
    const fotoId = await uploadPhoto('verpackung')

    expect(await estimate(fotoId, 'mhd')).toEqual({
      ok: false,
      message: 'Die KI kann hier nichts Sinnvolles schätzen. Es bleibt bei „Datum fehlt“.',
    })
    expect(await estimate(fotoId, 'naehrwerte')).toMatchObject({ ok: false })
    const calls = await testDb.db.select({ role: aiCalls.role }).from(aiCalls)
    expect(calls.map((call) => call.role).sort()).toEqual(['mhd_schaetzen', 'naehrwerte_schaetzen'])
  })

  it('lehnt ein MHD-Foto als Grundlage ab, ohne die KI zu fragen', async () => {
    const fotoId = await uploadPhoto('mhd')

    expect(await estimate(fotoId, 'mhd')).toEqual({
      ok: false,
      message: 'Für eine Schätzung braucht es ein Foto der Verpackung.',
    })
    expect(await testDb.db.select().from(aiCalls)).toEqual([])
  })

  it('sagt ruhig Bescheid, wenn die KI aus ist', async () => {
    const fotoId = await uploadPhoto('verpackung')
    await setAiEnabled(false)

    expect(await estimate(fotoId, 'naehrwerte')).toEqual({
      ok: false,
      message: 'Die Foto-Erkennung ist ausgeschaltet. Du kannst die Angaben von Hand eintragen.',
    })
  })

  it('öffnet den zuletzt genutzten Weg, beim ersten Mal das Foto nur mit Erkennung', async () => {
    const actor = { householdId, userId: owner.id }
    const deps = { db: testDb.db, env: FAKE_AI_ENV }
    await testDb.db.delete(units)
    await testDb.db.delete(captures)

    expect(await chooseCaptureWay(deps, actor)).toBe('photo')
    await setAiEnabled(false)
    expect(await chooseCaptureWay(deps, actor)).toBe('manual')

    await testDb.db.insert(captures).values(buildCapture({ ...actor, method: 'foto' }))
    expect(await chooseCaptureWay(deps, actor)).toBe('photo')
  })
})
