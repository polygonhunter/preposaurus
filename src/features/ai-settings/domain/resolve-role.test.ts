import { describe, expect, it } from 'vitest'
import type { AiRole } from '@/shared/config/ai-roles'
import { resolveRole, type AiSettingsSnapshot, type RoleAssignment } from './resolve-role'

const RECOMMENDED: Record<AiRole, string> = {
  verpackung: 'haiku',
  naehrwerte: 'haiku',
  naehrwerte_schaetzen: 'haiku',
  mhd: 'haiku',
  mhd_zweitversuch: 'sonnet',
  mhd_schaetzen: 'haiku',
}

const CONNECTION = { id: 'v1', isActive: true, hasKey: true }

const assignment = (overrides: Partial<RoleAssignment> = {}): RoleAssignment => ({
  role: 'mhd',
  connectionId: 'v1',
  model: 'eigenes-modell',
  isActive: true,
  ...overrides,
})

const snapshot = (overrides: Partial<AiSettingsSnapshot> = {}): AiSettingsSnapshot => ({
  isAiEnabled: true,
  hasEnvConnection: false,
  connections: [CONNECTION],
  assignments: [assignment()],
  recommendedModels: RECOMMENDED,
  ...overrides,
})

describe('resolveRole', () => {
  it('nutzt Verbindung und Modell der Zuweisung', () => {
    expect(resolveRole(snapshot(), 'mhd')).toEqual({
      status: 'ready',
      model: 'eigenes-modell',
      connection: { source: 'app', connectionId: 'v1' },
    })
  })

  it('läuft nicht, wenn die KI im Haushalt aus ist, auch mit Schlüssel aus der Umgebung', () => {
    const settings = snapshot({ isAiEnabled: false, hasEnvConnection: true })

    expect(resolveRole(settings, 'mhd')).toEqual({ status: 'ai-disabled' })
  })

  it('gibt dem Schlüssel aus der Umgebung Vorrang vor der Verbindung der Zuweisung', () => {
    expect(resolveRole(snapshot({ hasEnvConnection: true }), 'mhd')).toEqual({
      status: 'ready',
      model: 'eigenes-modell',
      connection: { source: 'env' },
    })
  })

  it('nimmt mit Schlüssel aus der Umgebung und ohne Zuweisung die Empfehlung', () => {
    const settings = snapshot({ hasEnvConnection: true, assignments: [] })

    expect(resolveRole(settings, 'mhd_zweitversuch')).toMatchObject({
      status: 'ready',
      model: 'sonnet',
    })
  })

  it('schaltet eine Rolle mit inaktiver Zuweisung ab, auch mit Schlüssel aus der Umgebung', () => {
    const settings = snapshot({
      hasEnvConnection: true,
      assignments: [assignment({ role: 'mhd_zweitversuch', isActive: false })],
    })

    expect(resolveRole(settings, 'mhd_zweitversuch')).toEqual({ status: 'role-inactive' })
  })

  it('meldet „nicht eingerichtet“ ohne Zuweisung und ohne Schlüssel aus der Umgebung', () => {
    expect(resolveRole(snapshot({ assignments: [] }), 'verpackung')).toEqual({
      status: 'not-configured',
    })
  })

  it('meldet eine inaktive oder fehlende Verbindung', () => {
    const inactive = snapshot({ connections: [{ ...CONNECTION, isActive: false }] })

    expect(resolveRole(inactive, 'mhd')).toEqual({ status: 'connection-inactive' })
    expect(resolveRole(snapshot({ connections: [] }), 'mhd')).toEqual({
      status: 'connection-inactive',
    })
  })

  it('meldet „nicht eingerichtet“, wenn die Verbindung keinen Schlüssel hat', () => {
    const settings = snapshot({ connections: [{ ...CONNECTION, hasKey: false }] })

    expect(resolveRole(settings, 'mhd')).toEqual({ status: 'not-configured' })
  })
})
