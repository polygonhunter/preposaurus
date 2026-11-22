// Schätzungen auf Wahl mit Fake-KI gegen die DB (#124): Die Rolle mhd_schaetzen steht nach
// Migration 0003 im Protokoll ki_aufruf und ist als Zuweisung erlaubt. Der Fake schätzt ohne feste
// Antwort nichts, also bleibt das Datum leer.
import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAiConnection } from '../../../src/features/ai-settings/application/create-ai-connection'
import { prepareRecognition } from '../../../src/features/ai-settings/application/prepare-recognition'
import {
  estimateBestBefore,
  estimateNutrition,
} from '../../../src/features/capture/application/estimate-on-request'
import { aiCalls } from '../../../src/server/db/schema/capture'
import { toCalendarDay } from '../../../src/shared/lib/dates'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import {
  PLAINTEXT_KEY,
  assignRole,
  envWith,
  insertHousehold,
} from '../ai-settings/ai-settings-fixtures'

const IMAGE = { data: new Uint8Array([1, 2, 3]), mimeType: 'image/jpeg' } as const
const context = { foodType: { key: 'nudeln', name: 'Nudeln' }, productName: null }

describe('KI-Schätzung auf Wahl mit Fake-KI (#124)', () => {
  let testDb: TestDb
  const fakeEnv = { ...envWith(), AI_PROVIDER: 'fake' as const }

  beforeAll(async () => {
    testDb = await createTestDb()
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('protokolliert beide Schätz-Rollen und erfindet ohne Antwort nichts', async () => {
    const householdId = await insertHousehold(testDb.db)
    const input = {
      householdId,
      photoId: null,
      required: ['mhd_schaetzen', 'naehrwerte_schaetzen'],
    } as const
    const prepared = await prepareRecognition({ db: testDb.db, env: fakeEnv }, input)
    if (!prepared.ok) throw new Error('Schätzung nicht vorbereitet')
    const { recognizer, models } = prepared.value
    const base = { recognizer, image: IMAGE, context }

    const bestBefore = await estimateBestBefore({
      ...base,
      model: models.mhd_schaetzen ?? 'fehlt',
      today: toCalendarDay('2026-11-22'),
    })
    const nutrition = await estimateNutrition({
      ...base,
      model: models.naehrwerte_schaetzen ?? 'fehlt',
    })

    expect(bestBefore).toEqual({ ok: false, error: { kind: 'no-estimate' } })
    expect(nutrition).toEqual({ ok: false, error: { kind: 'no-estimate' } })
    const calls = await testDb.db.select().from(aiCalls).where(eq(aiCalls.householdId, householdId))
    expect(calls.map((call) => call.role).sort()).toEqual(['mhd_schaetzen', 'naehrwerte_schaetzen'])
    expect(calls.every((call) => call.attempt === 1 && call.isSuccess)).toBe(true)
  })

  it('erlaubt eine Zuweisung der Rolle mhd_schaetzen', async () => {
    const householdId = await insertHousehold(testDb.db)
    const connection = await createAiConnection(
      { db: testDb.db, env: fakeEnv },
      { householdId, provider: 'anthropic', name: 'Anthropic', apiKey: PLAINTEXT_KEY },
    )

    await assignRole(testDb.db, { householdId, role: 'mhd_schaetzen', connectionId: connection.id })
    const prepared = await prepareRecognition(
      { db: testDb.db, env: envWith() },
      { householdId, photoId: null, required: ['mhd_schaetzen'] },
    )

    expect(prepared.ok && prepared.value.models).toEqual({ mhd_schaetzen: 'claude-haiku-5-5' })
  })
})
