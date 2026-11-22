import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAiConnection } from '../../../src/features/ai-settings/application/create-ai-connection'
import { testAiConnection } from '../../../src/features/ai-settings/application/test-ai-connection'
import { createVisionRecognizer } from '../../../src/server/ai/create-vision-recognizer'
import type { AiFailure } from '../../../src/server/ai/vision-recognizer'
import { aiConnections } from '../../../src/server/db/schema/ai-connections'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { APP_SECRET, PLAINTEXT_KEY, envWith, insertHousehold } from './ai-settings-fixtures'

const TESTED_AT = new Date('2026-11-22T10:00:00Z')

// Ersetzt nur den Testaufruf beim Anbieter. Merkt sich Modell und Schlüssel der Anfrage.
function testerFailingWith(failure: AiFailure | null) {
  const seen: { model: string; apiKey: string }[] = []
  const createTester: typeof createVisionRecognizer = (env, connection) => ({
    ...createVisionRecognizer({ AI_PROVIDER: 'fake' }, connection),
    testConnection: (model) => {
      seen.push({ model, apiKey: connection.apiKey.reveal() })
      return Promise.resolve(
        failure === null ? { ok: true, value: null } : { ok: false, error: failure },
      )
    },
  })
  return { createTester, seen }
}

describe('Use-Case Verbindung testen (#108)', () => {
  let testDb: TestDb

  const setup = async () => {
    const householdId = await insertHousehold(testDb.db)
    const input = {
      householdId,
      provider: 'anthropic',
      name: 'Anthropic',
      apiKey: PLAINTEXT_KEY,
    } as const
    const { id } = await createAiConnection({ db: testDb.db, env: envWith() }, input)
    return { householdId, connectionId: id }
  }

  const depsWith = (failure: AiFailure | null, env = envWith()) => {
    const tester = testerFailingWith(failure)
    const deps = { db: testDb.db, env, now: () => TESTED_AT, createTester: tester.createTester }
    return { deps, seen: tester.seen }
  }

  const storedStatus = async (connectionId: string) => {
    const [row] = await testDb.db
      .select({ status: aiConnections.lastTestStatus, testedAt: aiConnections.lastTestedAt })
      .from(aiConnections)
      .where(eq(aiConnections.id, connectionId))
    return row
  }

  beforeAll(async () => {
    testDb = await createTestDb()
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('testet mit dem entschlüsselten Schlüssel und speichert „ok“', async () => {
    const { householdId, connectionId } = await setup()
    const { deps, seen } = depsWith(null)

    const result = await testAiConnection(deps, { householdId, connection: { id: connectionId } })

    expect(result).toEqual({
      ok: true,
      value: { status: 'ok', message: 'Die Verbindung funktioniert.', testedAt: TESTED_AT },
    })
    expect(seen).toEqual([{ model: 'claude-haiku-5-5', apiKey: PLAINTEXT_KEY }])
    expect(await storedStatus(connectionId)).toEqual({ status: 'ok', testedAt: TESTED_AT })
  })

  it.each([
    ['invalid-key', 'schluessel_ungueltig', 'nicht angenommen'],
    ['no-credit', 'kein_guthaben', 'Guthaben'],
    ['timeout', 'zeitueberschreitung', 'nicht rechtzeitig'],
    ['rate-limited', 'fehler', 'bremst'],
    ['provider-error', 'fehler', 'Modell prüfen'],
  ] as const)(
    'übersetzt %s in den Status %s mit verständlichem Text',
    async (kind, status, text) => {
      const { householdId, connectionId } = await setup()
      const { deps } = depsWith({ kind })

      const result = await testAiConnection(deps, { householdId, connection: { id: connectionId } })

      expect(result.ok && result.value.status).toBe(status)
      expect(result.ok && result.value.message).toContain(text)
      expect((await storedStatus(connectionId))?.status).toBe(status)
    },
  )

  it('testet die Verbindung aus der Umgebung, ohne etwas zu speichern', async () => {
    const { householdId } = await setup()
    const { deps, seen } = depsWith(null, envWith({ ANTHROPIC_API_KEY: 'sk-ant-umgebung' }))

    const result = await testAiConnection(deps, { householdId, connection: 'env', model: 'x' })

    expect(result.ok && result.value.status).toBe('ok')
    expect(seen).toEqual([{ model: 'x', apiKey: 'sk-ant-umgebung' }])
  })

  it('meldet not-found ohne Schlüssel in der Umgebung oder für eine fremde Verbindung', async () => {
    const own = await setup()
    const foreign = await setup()
    const { deps } = depsWith(null)

    expect(
      await testAiConnection(deps, { householdId: own.householdId, connection: 'env' }),
    ).toEqual({
      ok: false,
      error: { kind: 'not-found' },
    })
    const connection = { id: foreign.connectionId }
    expect((await testAiConnection(deps, { householdId: own.householdId, connection })).ok).toBe(
      false,
    )
  })

  it('ruft den Anbieter nicht auf, wenn der Schlüssel nach einem neuen APP_SECRET unlesbar ist', async () => {
    const { householdId, connectionId } = await setup()
    const { deps, seen } = depsWith(null, envWith({ APP_SECRET: `${APP_SECRET}-neu` }))

    const result = await testAiConnection(deps, { householdId, connection: { id: connectionId } })

    expect(result.ok && result.value).toMatchObject({ status: 'schluessel_ungueltig' })
    expect(result.ok && result.value.message).toContain('APP_SECRET')
    expect(seen).toEqual([])
  })

  it('nennt den Schlüssel nie in der Rückgabe', async () => {
    const { householdId, connectionId } = await setup()
    const { deps } = depsWith({ kind: 'invalid-key' })

    const result = await testAiConnection(deps, { householdId, connection: { id: connectionId } })

    expect(JSON.stringify(result)).not.toContain(PLAINTEXT_KEY)
  })
})
