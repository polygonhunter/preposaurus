import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AiSettingsServices } from '../../../src/features/ai-settings/application/ai-settings-services'
import { loadAiConfig } from '../../../src/features/ai-settings/application/ai-config-service'
import type { AccessError } from '../../../src/server/auth/guards'
import { aiConnections, aiRoleAssignments } from '../../../src/server/db/schema/ai-connections'
import { householdSettings } from '../../../src/server/db/schema/household'
import type { Result } from '../../../src/shared/lib/result'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { APP_SECRET, insertHousehold } from './ai-settings-fixtures'

// Schritt „Foto-Erkennung einrichten“ der Einrichtung (#314). Der Schlüssel ist erfunden, nur in
// der Form eines Anthropic-Schlüssels. Kein Aufruf geht ins Netz.
const INVENTED_KEY = `sk-ant-erfunden-${'e'.repeat(40)}-ef56`
const NEXT_STEP = '/einrichten/home-bildschirm'

interface Admin {
  id: string
  householdId: string
  role: 'admin'
}

const state = vi.hoisted(() => ({
  access: null as Result<Admin, AccessError> | null,
  services: null as AiSettingsServices | null,
  continued: [] as string[],
}))

vi.mock('next/navigation', () => ({
  redirect: (path: string) => {
    throw new Error(`weiter nach ${path}`)
  },
}))
vi.mock('@/server/auth/guards', () => ({
  requireHouseholdAdmin: () => Promise.resolve(state.access),
}))
vi.mock('@/features/ai-settings/application/ai-settings-services', () => ({
  aiSettingsServices: () => Promise.resolve(state.services),
}))
vi.mock('@/features/auth/application/setup-step-request', () => ({
  continueSetupFromRequest: (_userId: string, step: string) => {
    state.continued.push(step)
    return Promise.resolve(NEXT_STEP)
  },
}))

const { setUpRecognitionAction } =
  await import('../../../src/features/ai-settings/actions/set-up-recognition-action')
const { continueSetupAction } =
  await import('../../../src/features/auth/actions/continue-setup-action')

const IDLE = { status: 'idle', message: null } as const

const keyForm = (key: string) => {
  const data = new FormData()
  data.set('schluessel', key)
  return data
}

describe('Einrichtung: Foto-Erkennung einrichten (#314)', () => {
  let testDb: TestDb
  let householdId: string

  const connectionRows = () =>
    testDb.db.select().from(aiConnections).where(eq(aiConnections.householdId, householdId))

  const assignmentRows = () =>
    testDb.db.select().from(aiRoleAssignments).where(eq(aiRoleAssignments.householdId, householdId))

  const isAiEnabled = async () => {
    const [row] = await testDb.db
      .select({ isAiEnabled: householdSettings.isAiEnabled })
      .from(householdSettings)
      .where(eq(householdSettings.householdId, householdId))
    return row?.isAiEnabled
  }

  beforeAll(async () => {
    testDb = await createTestDb()
  })

  afterAll(async () => {
    await testDb.close()
  })

  beforeEach(async () => {
    householdId = await insertHousehold(testDb.db, false)
    state.services = {
      db: testDb.db,
      env: { APP_SECRET, AI_PROVIDER: 'anthropic', ANTHROPIC_API_KEY: undefined },
      now: () => new Date('2026-11-24T08:30:00Z'),
    }
    state.access = { ok: true, value: { id: 'admin-1', householdId, role: 'admin' } }
    state.continued = []
  })

  it('speichert den Schlüssel verschlüsselt, schaltet ein und führt weiter', async () => {
    await expect(setUpRecognitionAction(IDLE, keyForm(INVENTED_KEY))).rejects.toThrow(
      `weiter nach ${NEXT_STEP}`,
    )

    const rows = await connectionRows()
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ name: 'Anthropic', provider: 'anthropic', apiKeyHint: 'ef56' })
    expect(JSON.stringify(rows)).not.toContain('erfunden')
    expect(await assignmentRows()).toHaveLength(6)
    expect(await isAiEnabled()).toBe(true)
    expect(state.continued).toEqual(['foto-erkennung'])

    if (state.services === null) throw new Error('Dienste fehlen')
    const config = await loadAiConfig(state.services, householdId)
    const role = config.forRole('verpackung')
    expect(role.ok && role.value.connection.apiKey.reveal()).toBe(INVENTED_KEY)
  })

  it('wählt einen freien Namen, wenn es „Anthropic“ schon gibt', async () => {
    const other = `sk-ant-erfunden-${'f'.repeat(40)}-0001`
    await expect(setUpRecognitionAction(IDLE, keyForm(other))).rejects.toThrow()

    await expect(setUpRecognitionAction(IDLE, keyForm(INVENTED_KEY))).rejects.toThrow()

    const names = (await connectionRows()).map(({ name }) => name).sort()
    expect(names).toEqual(['Anthropic', 'Anthropic 2'])
  })

  it('meldet einen falschen Schlüssel am Feld, ohne ihn zu nennen, und speichert nichts', async () => {
    const result = await setUpRecognitionAction(IDLE, keyForm('sk-ant-kurz-erfunden'))

    expect(result).toEqual({
      status: 'error',
      message: null,
      errors: { apiKey: 'Der Schlüssel ist zu kurz. Bitte ganz einfügen.' },
    })
    expect(JSON.stringify(result)).not.toContain('erfunden')
    expect(await connectionRows()).toEqual([])
    expect(await isAiEnabled()).toBe(false)
    expect(state.continued).toEqual([])
  })

  it('lässt nur den Admin einrichten', async () => {
    state.access = { ok: false, error: { kind: 'forbidden' } }

    const result = await setUpRecognitionAction(IDLE, keyForm(INVENTED_KEY))

    expect(result).toEqual({ status: 'error', message: 'Das ändert ein Admin.' })
    expect(await connectionRows()).toEqual([])
    expect(await isAiEnabled()).toBe(false)
  })

  it('Überspringen ändert nichts an der Foto-Erkennung', async () => {
    const skip = new FormData()
    skip.set('schritt', 'foto-erkennung')

    await expect(continueSetupAction(skip)).rejects.toThrow(`weiter nach ${NEXT_STEP}`)

    expect(state.continued).toEqual(['foto-erkennung'])
    expect(await connectionRows()).toEqual([])
    expect(await assignmentRows()).toEqual([])
    expect(await isAiEnabled()).toBe(false)
  })
})
