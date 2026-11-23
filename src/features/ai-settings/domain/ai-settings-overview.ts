// DTO der Seite „Foto-Erkennung“ (#108, #79). Liegt in domain/, weil die Oberfläche Typen nur von
// hier lesen darf. Vom Schlüssel steht nur der Hinweis aus den letzten vier Zeichen darin.
import type { AiRole } from '@/shared/config/ai-roles'
import type { AI_CONNECTION_STATUSES, AI_PROVIDERS } from '@/shared/config/constants'
import type { AiSetupStatus } from './ai-status'
import type { ConnectionSource, RoleResolution } from './resolve-role'

export interface ConnectionOverview {
  id: string
  name: string
  provider: (typeof AI_PROVIDERS)[number]
  /** letzte vier Zeichen des Schlüssels, null ohne Schlüssel */
  keyHint: string | null
  lastTest: { status: (typeof AI_CONNECTION_STATUSES)[number]; testedAt: Date } | null
  isActive: boolean
}

export interface RoleOverview {
  role: AiRole
  model: string
  recommendedModel: string
  isActive: boolean
  isSwitchable: boolean
  /** Verbindung der Zuweisung, null ohne Zuweisung */
  assignedConnectionId: string | null
  resolution: RoleResolution['status']
  /** Verbindung, die tatsächlich antwortet: env, eine aus der App oder keine */
  usedConnection: ConnectionSource | null
}

export interface AiSettingsOverview {
  isAiEnabled: boolean
  status: AiSetupStatus
  /** feste Verbindung aus der Umgebung: ANTHROPIC_API_KEY oder der Test-Anbieter */
  envConnection: 'anthropic' | 'fake' | null
  connections: ConnectionOverview[]
  roles: RoleOverview[]
}
