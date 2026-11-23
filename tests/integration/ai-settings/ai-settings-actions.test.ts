import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AiSettingsServices } from '../../../src/features/ai-settings/application/ai-settings-services'
import { getAiSettingsOverview } from '../../../src/features/ai-settings/application/get-ai-settings-overview'
import type { AccessError } from '../../../src/server/auth/guards'
import { aiConnections, aiRoleAssignments } from '../../../src/server/db/schema/ai-connections'
import { householdSettings } from '../../../src/server/db/schema/household'
import type { Result } from '../../../src/shared/lib/result'
import { createTestDb, type TestDb } from '../../helpers/test-db'
import { APP_SECRET, insertHousehold } from './ai-settings-fixtures'

// Erfundene Schlüssel in der Form eines Anthropic-Schlüssels, nur für diesen Test
const FIRST_KEY = `sk-ant-erfunden-${'a'.repeat(40)}-ab12`
const SECOND_KEY = `sk-ant-erfunden-${'b'.repeat(40)}-cd34`

type Access = Result<{ householdId: string; role: 'admin' | 'mitglied' }, AccessError>

const state = vi.hoisted(() => ({
  access: null as Access | null,
  services: null as AiSettingsServices | null,
}))

vi.mock('next/cache', () => ({ refresh: () => undefined }))
vi.mock('@/server/auth/guards', () => ({
  requireHouseholdAdmin: () => Promise.resolve(state.access),
}))
vi.mock('@/features/ai-settings/application/ai-settings-services', () => ({
  aiSettingsServices: () => Promise.resolve(state.services),
}))

const { addAiConnectionAction } =
  await import('../../../src/features/ai-settings/actions/add-ai-connection-action')
const { replaceAiKeyAction } =
  await import('../../../src/features/ai-settings/actions/replace-ai-key-action')
const { removeAiConnectionAction } =
  await import('../../../src/features/ai-settings/actions/remove-ai-connection-action')
const { testAiConnectionAction } =
  await import('../../../src/features/ai-settings/actions/test-ai-connection-action')
const { saveAiEnabledAction } =
  await import('../../../src/features/ai-settings/actions/save-ai-enabled-action')
const { saveAiRolesAction } =
  await import('../../../src/features/ai-settings/actions/save-ai-roles-action')

const IDLE = { status: 'idle', message: null } as const

const form = (fields: Record<string, string>) => {
  const data = new FormData()
  for (const [name, value] of Object.entries(fields)) data.set(name, value)
  return data
}

describe('Actions der Seite Foto-Erkennung (#108, #79)', () => {
  let testDb: TestDb
  let householdId: string

  const signInAs = (role: 'admin' | 'mitglied') => {
    state.access =
      role === 'admin'
        ? { ok: true, value: { householdId, role } }
        : { ok: false, error: { kind: 'forbidden' } }
  }

  const connectionRows = () =>
    testDb.db.select().from(aiConnections).where(eq(aiConnections.householdId, householdId))

  const assignmentRows = () =>
    testDb.db.select().from(aiRoleAssignments).where(eq(aiRoleAssignments.householdId, householdId))

  const services = (): AiSettingsServices => {
    if (state.services === null) throw new Error('Dienste fehlen')
    return state.services
  }

  const addConnection = (name: string, key = FIRST_KEY) =>
    addAiConnectionAction(IDLE, form({ name, schluessel: key }))

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
      env: { APP_SECRET, AI_PROVIDER: 'fake', ANTHROPIC_API_KEY: undefined },
      now: () => new Date('2026-11-23T08:30:00Z'),
    }
    signInAs('admin')
  })

  it('speichert den Schlüssel nur verschlüsselt und gibt ihn nirgends zurück', async () => {
    const result = await addConnection('Anthropic')

    expect(result).toEqual({
      status: 'saved',
      message: 'Gespeichert. Der Schlüssel endet auf …ab12.',
    })
    const rows = await connectionRows()
    expect(rows).toHaveLength(1)
    expect(JSON.stringify(rows)).not.toContain(FIRST_KEY)
    expect(JSON.stringify(rows)).not.toContain('erfunden')
    expect(rows[0]?.apiKeyHint).toBe('ab12')
    const overview = await getAiSettingsOverview(services(), householdId)
    expect(JSON.stringify(overview)).not.toContain('erfunden')
    expect(overview.connections[0]).toMatchObject({ name: 'Anthropic', keyHint: 'ab12' })
  })

  it('weist jeder Rolle die erste Verbindung mit dem empfohlenen Modell zu', async () => {
    await addConnection('Anthropic')
    await addConnection('Zweiter', SECOND_KEY)

    const rows = await assignmentRows()
    const [first] = await connectionRows()
    expect(rows).toHaveLength(6)
    expect(new Set(rows.map(({ connectionId }) => connectionId))).toEqual(new Set([first?.id]))
    expect(rows.find(({ role }) => role === 'mhd_zweitversuch')?.model).toBe('claude-sonnet-5-5')
    expect(rows.find(({ role }) => role === 'verpackung')?.model).toBe('claude-haiku-5-5')
  })

  it('meldet Fehler am Feld, ohne den eingegebenen Schlüssel zu nennen', async () => {
    const tooShort = await addConnection('Anthropic', 'sk-ant-kurz-erfunden')
    const wrongFormat = await addConnection('Anthropic', 'falsch erfunden 1234567890')

    expect(tooShort.errors?.apiKey).toBe('Der Schlüssel ist zu kurz. Bitte ganz einfügen.')
    expect(wrongFormat.errors?.apiKey).toContain('beginnt mit „sk-ant-“')
    expect(JSON.stringify([tooShort, wrongFormat])).not.toContain('erfunden')
    expect(await connectionRows()).toEqual([])
  })

  it('lehnt einen doppelten Namen ab', async () => {
    await addConnection('Anthropic')

    const result = await addConnection('anthropic', SECOND_KEY)

    expect(result.errors).toEqual({ name: 'Diesen Namen gibt es schon.' })
    expect(await connectionRows()).toHaveLength(1)
  })

  it('lässt ein Mitglied nichts ändern', async () => {
    signInAs('mitglied')

    const results = [
      await addConnection('Anthropic'),
      await saveAiEnabledAction(IDLE, form({ ki: 'an' })),
      await testAiConnectionAction(IDLE, form({ ziel: 'env' })),
    ]

    for (const result of results) {
      expect(result).toEqual({ status: 'error', message: 'Das ändert ein Admin.' })
    }
    expect(await connectionRows()).toEqual([])
    const [settings] = await testDb.db
      .select({ isAiEnabled: householdSettings.isAiEnabled })
      .from(householdSettings)
      .where(eq(householdSettings.householdId, householdId))
    expect(settings?.isAiEnabled).toBe(false)
  })

  it('schaltet die Foto-Erkennung an und wieder aus', async () => {
    expect(await saveAiEnabledAction(IDLE, form({ ki: 'an' }))).toMatchObject({ status: 'saved' })
    expect((await getAiSettingsOverview(services(), householdId)).isAiEnabled).toBe(true)

    await saveAiEnabledAction(IDLE, form({}))

    expect((await getAiSettingsOverview(services(), householdId)).isAiEnabled).toBe(false)
  })

  it('testet eine Verbindung mit dem Test-Anbieter und speichert das Ergebnis', async () => {
    await addConnection('Anthropic')
    const [row] = await connectionRows()

    const result = await testAiConnectionAction(IDLE, form({ ziel: row?.id ?? '' }))

    expect(result).toEqual({ status: 'saved', message: 'Die Verbindung funktioniert.' })
    const [tested] = await connectionRows()
    expect(tested?.lastTestStatus).toBe('ok')
  })

  it('ersetzt den Schlüssel und setzt den Teststatus zurück', async () => {
    await addConnection('Anthropic')
    const [row] = await connectionRows()
    const id = row?.id ?? ''
    await testAiConnectionAction(IDLE, form({ ziel: id }))

    const result = await replaceAiKeyAction(IDLE, form({ id, schluessel: SECOND_KEY }))

    expect(result).toEqual({ status: 'saved', message: 'Ersetzt. Der Schlüssel endet auf …cd34.' })
    const [replaced] = await connectionRows()
    expect(replaced).toMatchObject({ apiKeyHint: 'cd34', lastTestStatus: null })
    expect(JSON.stringify(replaced)).not.toContain('erfunden')
  })

  it('verschiebt beim Entfernen die Rollen auf eine andere Verbindung', async () => {
    await addConnection('Anthropic')
    await addConnection('Zweiter', SECOND_KEY)
    const [first, second] = await connectionRows()

    const result = await removeAiConnectionAction(IDLE, form({ id: first?.id ?? '' }))

    expect(result).toEqual({ status: 'saved', message: 'Die Verbindung ist entfernt.' })
    const rows = await assignmentRows()
    expect(rows).toHaveLength(6)
    expect(rows.every(({ connectionId }) => connectionId === second?.id)).toBe(true)
  })

  it('entfernt die letzte Verbindung samt Zuweisungen', async () => {
    await addConnection('Anthropic')
    const [row] = await connectionRows()

    await removeAiConnectionAction(IDLE, form({ id: row?.id ?? '' }))

    expect(await connectionRows()).toEqual([])
    expect(await assignmentRows()).toEqual([])
  })

  it('speichert Modell und an/aus je Rolle, Pflichtrollen bleiben an', async () => {
    await addConnection('Anthropic')
    const fields: Record<string, string> = {
      'modell-verpackung': 'claude-sonnet-5-5',
      'modell-naehrwerte': 'claude-haiku-5-5',
      'modell-naehrwerte_schaetzen': 'claude-haiku-5-5',
      'modell-mhd': 'claude-opus-5-5',
      'modell-mhd_zweitversuch': 'claude-sonnet-5-5',
      'modell-mhd_schaetzen': 'claude-haiku-5-5',
      'aktiv-naehrwerte_schaetzen': 'an',
    }

    const result = await saveAiRolesAction(IDLE, form(fields))

    expect(result).toEqual({ status: 'saved', message: 'Gespeichert.' })
    const rows = await assignmentRows()
    const byRole = Object.fromEntries(rows.map((row) => [row.role, row]))
    expect(byRole['verpackung']).toMatchObject({ model: 'claude-sonnet-5-5', isActive: true })
    expect(byRole['mhd']).toMatchObject({ model: 'claude-opus-5-5', isActive: true })
    expect(byRole['mhd_zweitversuch']?.isActive).toBe(false)
    expect(byRole['naehrwerte_schaetzen']?.isActive).toBe(true)

    await saveAiRolesAction(IDLE, form({ aktion: 'zuruecksetzen' }))

    const reset = Object.fromEntries((await assignmentRows()).map((row) => [row.role, row]))
    expect(reset['verpackung']?.model).toBe('claude-haiku-5-5')
    expect(reset['mhd']?.model).toBe('claude-haiku-5-5')
    expect(reset['mhd_zweitversuch']?.isActive).toBe(false)
  })

  it('verlangt für Modelle zuerst eine Verbindung', async () => {
    const result = await saveAiRolesAction(IDLE, form({ aktion: 'zuruecksetzen' }))

    expect(result).toEqual({
      status: 'error',
      message: 'Bitte zuerst eine Verbindung mit Schlüssel hinzufügen.',
    })
  })
})
