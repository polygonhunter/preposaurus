// Status der Foto-Erkennung für die Einstellungen (#79): eingerichtet, aus, nicht eingerichtet
// oder Fehler beim letzten Test. Reine Regel auf Basis von resolveRole:
// 1. Ist die KI im Haushalt aus, ist der Status „aus“, egal wie der Rest aussieht.
// 2. Fehlt einer Pflichtrolle (Verpackung, Nährwerte, MHD) eine nutzbare Verbindung, ist sie
//    „nicht eingerichtet“.
// 3. Ist der letzte Test einer Verbindung gescheitert, die eine laufende Rolle nutzt, heißt es
//    „Fehler beim letzten Test“. Ein Test, der nie lief, ist kein Fehler.
import type { AiRole } from '@/shared/config/ai-roles'
import { resolveRole, type AiSettingsSnapshot, type RoleResolution } from './resolve-role'

export type AiSetupStatus = 'ready' | 'disabled' | 'not-configured' | 'test-failed'

export interface RoleStatus {
  role: AiRole
  resolution: RoleResolution
}

export interface AiSetupSummary {
  status: AiSetupStatus
  roles: RoleStatus[]
}

interface SummaryInput {
  snapshot: AiSettingsSnapshot
  /** alle Rollen in der Reihenfolge der Anzeige */
  roles: readonly AiRole[]
  /** Rollen, die sich nicht abschalten lassen */
  requiredRoles: readonly AiRole[]
  /** Verbindungen, deren letzter Test nicht „ok“ war */
  failedConnectionIds: readonly string[]
}

function usesFailedConnection(resolution: RoleResolution, failed: readonly string[]): boolean {
  if (resolution.status !== 'ready' || resolution.connection.source !== 'app') return false
  return failed.includes(resolution.connection.connectionId)
}

function statusOf(input: SummaryInput, roles: readonly RoleStatus[]): AiSetupStatus {
  if (!input.snapshot.isAiEnabled) return 'disabled'
  const isRequiredMissing = roles.some(
    ({ role, resolution }) => input.requiredRoles.includes(role) && resolution.status !== 'ready',
  )
  if (isRequiredMissing) return 'not-configured'
  const hasFailedTest = roles.some(({ resolution }) =>
    usesFailedConnection(resolution, input.failedConnectionIds),
  )
  return hasFailedTest ? 'test-failed' : 'ready'
}

export function summarizeAiSetup(input: SummaryInput): AiSetupSummary {
  const roles = input.roles.map((role) => ({ role, resolution: resolveRole(input.snapshot, role) }))
  return { status: statusOf(input, roles), roles }
}
