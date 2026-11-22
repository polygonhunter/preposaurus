import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAiConnection } from '../../../src/features/ai-settings/application/create-ai-connection'
import { prepareRecognition } from '../../../src/features/ai-settings/application/prepare-recognition'
import { recognizeBestBefore } from '../../../src/features/capture/application/recognize-best-before'
import { aiCalls } from '../../../src/server/db/schema/capture'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { PLAINTEXT_KEY, assignRole, envWith, insertHousehold } from './ai-settings-fixtures'

const IMAGE = { data: new Uint8Array([1, 2, 3]), mimeType: 'image/jpeg' } as const

describe('Erkennung vorbereiten und protokollieren (#59, #108)', () => {
  let testDb: TestDb
  const fakeEnv = { ...envWith(), AI_PROVIDER: 'fake' as const }

  const setup = async () => {
    const householdId = await insertHousehold(testDb.db)
    const input = {
      householdId,
      provider: 'anthropic',
      name: 'Anthropic',
      apiKey: PLAINTEXT_KEY,
    } as const
    const { id } = await createAiConnection({ db: testDb.db, env: fakeEnv }, input)
    await assignRole(testDb.db, { householdId, role: 'mhd', connectionId: id })
    return { householdId, connectionId: id }
  }

  const callsOf = (householdId: string) =>
    testDb.db
      .select()
      .from(aiCalls)
      .where(eq(aiCalls.householdId, householdId))
      .orderBy(aiCalls.attempt)

  beforeAll(async () => {
    testDb = await createTestDb()
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('protokolliert beim MHD Erst- und Zweitversuch mit Rolle, Versuch und Verbindung', async () => {
    const { householdId, connectionId } = await setup()
    await assignRole(testDb.db, {
      householdId,
      role: 'mhd_zweitversuch',
      connectionId,
      model: 'claude-sonnet-5-5',
    })
    // Der Fake ist eine feste Verbindung aus der Umgebung: Modell und aktiv kommen aus der
    // Zuweisung, im Protokoll steht keine Verbindungs-ID.
    const deps = { db: testDb.db, env: fakeEnv }
    const input = {
      householdId,
      photoId: null,
      required: ['mhd'],
      optional: ['mhd_zweitversuch'],
    } as const

    const prepared = await prepareRecognition(deps, input)
    if (!prepared.ok) throw new Error('Erkennung nicht vorbereitet')
    const { recognizer, models } = prepared.value
    const first = models.mhd ?? 'fehlt'
    await recognizeBestBefore({
      recognizer,
      image: IMAGE,
      models: { first, second: models.mhd_zweitversuch ?? null },
    })

    const calls = await callsOf(householdId)
    expect(calls).toEqual([
      expect.objectContaining({
        role: 'mhd',
        attempt: 1,
        connectionId: null,
        model: 'claude-haiku-5-5',
        isSuccess: true,
        confidence: 'niedrig',
      }),
      expect.objectContaining({
        role: 'mhd_zweitversuch',
        attempt: 2,
        connectionId: null,
        model: 'claude-sonnet-5-5',
      }),
    ])
  })

  it('lässt einen abgeschalteten Zweitversuch still weg', async () => {
    const { householdId, connectionId } = await setup()
    await assignRole(testDb.db, {
      householdId,
      role: 'mhd_zweitversuch',
      connectionId,
      isActive: false,
    })
    const input = {
      householdId,
      photoId: null,
      required: ['mhd'],
      optional: ['mhd_zweitversuch'],
    } as const

    const prepared = await prepareRecognition({ db: testDb.db, env: fakeEnv }, input)

    expect(prepared.ok && prepared.value.models).toEqual({ mhd: 'claude-haiku-5-5' })
  })

  it('meldet eine Pflichtrolle, die nicht eingerichtet ist', async () => {
    const { householdId } = await setup()
    const input = { householdId, photoId: null, required: ['verpackung'] } as const

    expect(await prepareRecognition({ db: testDb.db, env: envWith() }, input)).toEqual({
      ok: false,
      error: { kind: 'not-configured' },
    })
  })

  it('läuft mit AI_PROVIDER=fake ohne Schlüssel und ohne Verbindung, mit den Empfehlungen', async () => {
    const householdId = await insertHousehold(testDb.db)
    const input = { householdId, photoId: null, required: ['verpackung', 'mhd'] } as const

    const prepared = await prepareRecognition({ db: testDb.db, env: fakeEnv }, input)

    expect(prepared.ok && prepared.value.models).toEqual({
      verpackung: 'claude-haiku-5-5',
      mhd: 'claude-haiku-5-5',
    })
  })

  it('respektiert auch mit dem Fake den Haushaltsschalter', async () => {
    const householdId = await insertHousehold(testDb.db, false)
    const input = { householdId, photoId: null, required: ['mhd'] } as const

    expect(await prepareRecognition({ db: testDb.db, env: fakeEnv }, input)).toEqual({
      ok: false,
      error: { kind: 'ai-disabled' },
    })
  })
})
