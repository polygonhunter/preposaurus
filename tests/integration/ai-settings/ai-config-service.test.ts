import { inspect } from 'node:util'
import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { loadAiConfig } from '../../../src/features/ai-settings/application/ai-config-service'
import { createAiConnection } from '../../../src/features/ai-settings/application/create-ai-connection'
import { aiConnections } from '../../../src/server/db/schema/ai-connections'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import {
  APP_SECRET,
  PLAINTEXT_KEY,
  assignRole,
  envWith,
  insertHousehold,
} from './ai-settings-fixtures'

describe('Konfigurations-Service der KI (#108)', () => {
  let testDb: TestDb

  const setup = async (isAiEnabled = true) => {
    const householdId = await insertHousehold(testDb.db, isAiEnabled)
    const deps = { db: testDb.db, env: envWith() }
    const input = {
      householdId,
      provider: 'anthropic',
      name: 'Anthropic',
      apiKey: PLAINTEXT_KEY,
    } as const
    const connection = await createAiConnection(deps, input)
    return { householdId, connectionId: connection.id, keyHint: connection.keyHint }
  }

  beforeAll(async () => {
    testDb = await createTestDb()
  })

  afterAll(async () => {
    await testDb.close()
  })

  it('speichert den Schlüssel nur verschlüsselt und gibt nur den Hinweis zurück', async () => {
    const { connectionId, keyHint } = await setup()

    const [row] = await testDb.db
      .select()
      .from(aiConnections)
      .where(eq(aiConnections.id, connectionId))

    expect(keyHint).toBe('…4f2a')
    expect(row).toMatchObject({ apiKeyHint: '4f2a', apiKeyVersion: 1 })
    expect(JSON.stringify(row)).not.toContain(PLAINTEXT_KEY)
  })

  it('liefert Verbindung, entschlüsselten Schlüssel und Modell der Zuweisung', async () => {
    const { householdId, connectionId } = await setup()
    await assignRole(testDb.db, { householdId, role: 'mhd', connectionId, model: 'eigenes-modell' })

    const config = (await loadAiConfig({ db: testDb.db, env: envWith() }, householdId)).forRole(
      'mhd',
    )

    expect(config.ok && config.value).toMatchObject({ model: 'eigenes-modell', connectionId })
    expect(config.ok && config.value.connection.apiKey.reveal()).toBe(PLAINTEXT_KEY)
  })

  it('verrät den Schlüssel weder in JSON noch in util.inspect', async () => {
    const { householdId, connectionId } = await setup()
    await assignRole(testDb.db, { householdId, role: 'mhd', connectionId })

    const config = (await loadAiConfig({ db: testDb.db, env: envWith() }, householdId)).forRole(
      'mhd',
    )

    expect(JSON.stringify(config)).not.toContain(PLAINTEXT_KEY)
    expect(inspect(config, { depth: 10 })).not.toContain(PLAINTEXT_KEY)
  })

  it('gibt dem Schlüssel aus der Umgebung Vorrang und nimmt ohne Zuweisung die Empfehlung', async () => {
    const { householdId } = await setup()
    const env = envWith({ ANTHROPIC_API_KEY: 'sk-ant-aus-der-umgebung' })

    const config = (await loadAiConfig({ db: testDb.db, env }, householdId)).forRole(
      'mhd_zweitversuch',
    )

    expect(config.ok && config.value).toMatchObject({
      model: 'claude-sonnet-5-5',
      connectionId: null,
    })
    expect(config.ok && config.value.connection.apiKey.reveal()).toBe('sk-ant-aus-der-umgebung')
  })

  it('meldet „nicht eingerichtet“ ohne Zuweisung und ohne Schlüssel aus der Umgebung', async () => {
    const { householdId } = await setup()

    const config = await loadAiConfig({ db: testDb.db, env: envWith() }, householdId)

    expect(config.forRole('verpackung')).toEqual({ ok: false, error: { kind: 'not-configured' } })
  })

  it('lässt keine Rolle laufen, wenn die KI im Haushalt aus ist', async () => {
    const { householdId, connectionId } = await setup(false)
    await assignRole(testDb.db, { householdId, role: 'mhd', connectionId })

    const config = await loadAiConfig({ db: testDb.db, env: envWith() }, householdId)

    expect(config.forRole('mhd')).toEqual({ ok: false, error: { kind: 'ai-disabled' } })
  })

  it('schaltet den Zweitversuch ab, wenn seine Zuweisung inaktiv ist', async () => {
    const { householdId, connectionId } = await setup()
    await assignRole(testDb.db, {
      householdId,
      role: 'mhd_zweitversuch',
      connectionId,
      isActive: false,
    })

    const config = await loadAiConfig({ db: testDb.db, env: envWith() }, householdId)

    expect(config.forRole('mhd_zweitversuch')).toEqual({
      ok: false,
      error: { kind: 'role-inactive' },
    })
  })

  it('meldet einen unlesbaren Schlüssel, wenn sich APP_SECRET geändert hat', async () => {
    const { householdId, connectionId } = await setup()
    await assignRole(testDb.db, { householdId, role: 'mhd', connectionId })
    const env = envWith({ APP_SECRET: `${APP_SECRET}-neu` })

    const config = await loadAiConfig({ db: testDb.db, env }, householdId)

    expect(config.forRole('mhd')).toEqual({ ok: false, error: { kind: 'key-unreadable' } })
  })

  it('liest keine Zuweisungen eines fremden Haushalts', async () => {
    const own = await setup()
    const foreign = await setup()
    await assignRole(testDb.db, {
      householdId: foreign.householdId,
      role: 'mhd',
      connectionId: foreign.connectionId,
    })

    const config = await loadAiConfig({ db: testDb.db, env: envWith() }, own.householdId)

    expect(config.forRole('mhd')).toEqual({ ok: false, error: { kind: 'not-configured' } })
  })
})
