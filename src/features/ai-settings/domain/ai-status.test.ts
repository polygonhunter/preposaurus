import { describe, expect, it } from 'vitest'
import type { AiRole } from '@/shared/config/ai-roles'
import { summarizeAiSetup } from './ai-status'
import type { AiSettingsSnapshot, RoleAssignment } from './resolve-role'

const RECOMMENDED: Record<AiRole, string> = {
  verpackung: 'haiku',
  naehrwerte: 'haiku',
  naehrwerte_schaetzen: 'haiku',
  mhd: 'haiku',
  mhd_zweitversuch: 'sonnet',
  mhd_schaetzen: 'haiku',
}

const REQUIRED: AiRole[] = ['verpackung', 'naehrwerte', 'mhd']
const ROLES: AiRole[] = [...REQUIRED, 'mhd_zweitversuch']

const assign = (role: AiRole, overrides: Partial<RoleAssignment> = {}): RoleAssignment => ({
  role,
  connectionId: 'v1',
  model: RECOMMENDED[role],
  isActive: true,
  ...overrides,
})

const snapshot = (overrides: Partial<AiSettingsSnapshot> = {}): AiSettingsSnapshot => ({
  isAiEnabled: true,
  hasEnvConnection: false,
  connections: [{ id: 'v1', isActive: true, hasKey: true }],
  assignments: ROLES.map((role) => assign(role)),
  recommendedModels: RECOMMENDED,
  ...overrides,
})

const summarize = (overrides: Partial<AiSettingsSnapshot> = {}, failed: string[] = []) =>
  summarizeAiSetup({
    snapshot: snapshot(overrides),
    roles: ROLES,
    requiredRoles: REQUIRED,
    failedConnectionIds: failed,
  })

describe('summarizeAiSetup', () => {
  it('ist eingerichtet, wenn jede Pflichtrolle eine nutzbare Verbindung hat', () => {
    const summary = summarize()

    expect(summary.status).toBe('ready')
    expect(summary.roles.map(({ role }) => role)).toEqual(ROLES)
    expect(summary.roles[3]?.resolution).toEqual({
      status: 'ready',
      model: 'sonnet',
      connection: { source: 'app', connectionId: 'v1' },
    })
  })

  it('ist aus, wenn der Haushaltsschalter aus ist', () => {
    expect(summarize({ isAiEnabled: false }).status).toBe('disabled')
  })

  it('ist nicht eingerichtet, wenn einer Pflichtrolle die Verbindung fehlt', () => {
    expect(summarize({ connections: [], assignments: [] }).status).toBe('not-configured')
  })

  it('bleibt eingerichtet, wenn nur eine abschaltbare Rolle aus ist', () => {
    const assignments = [
      ...REQUIRED.map((role) => assign(role)),
      assign('mhd_zweitversuch', { isActive: false }),
    ]

    expect(summarize({ assignments }).status).toBe('ready')
  })

  it('ist nicht eingerichtet, wenn eine Pflichtrolle abgeschaltet ist', () => {
    const assignments = [assign('verpackung', { isActive: false }), assign('naehrwerte')]

    expect(summarize({ assignments }).status).toBe('not-configured')
  })

  it('meldet einen gescheiterten letzten Test einer genutzten Verbindung', () => {
    expect(summarize({}, ['v1']).status).toBe('test-failed')
  })

  it('übergeht einen gescheiterten Test einer Verbindung, die keine Rolle nutzt', () => {
    expect(summarize({}, ['v2']).status).toBe('ready')
  })

  it('übergeht Tests der App-Verbindungen, solange die Umgebung Vorrang hat', () => {
    const summary = summarize({ hasEnvConnection: true, assignments: [] }, ['v1'])

    expect(summary.status).toBe('ready')
  })
})
