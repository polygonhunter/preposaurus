// Welche Verbindung und welches Modell eine Foto-Rolle nutzt (#108, DATENKATALOG §8.3).
// Reine Regel ohne DB und Entschlüsselung:
// 1. Ist die KI im Haushalt aus (ki_aktiv), läuft keine Rolle.
// 2. Eine Zuweisung mit aktiv = false schaltet die Rolle ab, z. B. den MHD-Zweitversuch.
// 3. Das Modell kommt aus der Zuweisung, ohne Zuweisung aus der Empfehlung (ai-roles.ts).
// 4. Eine feste Verbindung aus der Umgebung hat Vorrang: ein Schlüssel in ANTHROPIC_API_KEY
//    („aus Umgebungsvariable“) oder AI_PROVIDER=fake für die Entwicklung ohne Schlüssel. Sie gilt
//    für alle Rollen, die Verbindung der Zuweisung tritt dann zurück.
// 5. Sonst braucht die Rolle eine Zuweisung auf eine aktive Verbindung mit Schlüssel.
import type { AiRole } from '@/shared/config/ai-roles'

interface ConnectionSummary {
  id: string
  isActive: boolean
  hasKey: boolean
}

export interface RoleAssignment {
  role: AiRole
  connectionId: string
  model: string
  isActive: boolean
}

export interface AiSettingsSnapshot {
  isAiEnabled: boolean
  hasEnvConnection: boolean
  connections: readonly ConnectionSummary[]
  assignments: readonly RoleAssignment[]
  /** Empfehlung je Rolle, wird übergeben, weil domain/ Werte aus shared/config nicht importiert */
  recommendedModels: Readonly<Record<AiRole, string>>
}

export type ConnectionSource = { source: 'env' } | { source: 'app'; connectionId: string }

export type RoleUnavailable =
  'ai-disabled' | 'role-inactive' | 'not-configured' | 'connection-inactive'

export type RoleResolution =
  { status: 'ready'; model: string; connection: ConnectionSource } | { status: RoleUnavailable }

function resolveAppConnection(
  snapshot: AiSettingsSnapshot,
  assignment: RoleAssignment | undefined,
): ConnectionSource | RoleUnavailable {
  if (assignment === undefined) return 'not-configured'
  const connection = snapshot.connections.find((item) => item.id === assignment.connectionId)
  if (!connection?.isActive) return 'connection-inactive'
  // Ohne Schlüssel (später: lokales Modell ohne Schlüssel) ist eine Anthropic-Verbindung unfertig.
  if (!connection.hasKey) return 'not-configured'
  return { source: 'app', connectionId: connection.id }
}

export function resolveRole(snapshot: AiSettingsSnapshot, role: AiRole): RoleResolution {
  if (!snapshot.isAiEnabled) return { status: 'ai-disabled' }
  const assignment = snapshot.assignments.find((item) => item.role === role)
  if (assignment?.isActive === false) return { status: 'role-inactive' }
  const model = assignment?.model ?? snapshot.recommendedModels[role]
  if (snapshot.hasEnvConnection) return { status: 'ready', model, connection: { source: 'env' } }
  const connection = resolveAppConnection(snapshot, assignment)
  if (typeof connection === 'string') return { status: connection }
  return { status: 'ready', model, connection }
}
