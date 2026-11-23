// Stand der Foto-Erkennung für die Einstellungsseite (#108, #79): Schalter, Status, Verbindungen und
// je Rolle Modell und Verbindung. Ein schmales DTO für die Oberfläche: Vom Schlüssel kommen nur die
// letzten vier Zeichen mit, nie Chiffrat oder Klartext. Entschlüsselt wird hier nichts.
import 'server-only'
import { AI_ROLE_DEFAULT_MODELS, AI_ROLES, AI_SWITCHABLE_ROLES } from '@/shared/config/ai-roles'
import {
  loadHouseholdAiSettings,
  type HouseholdAiSettings,
  type StoredConnection,
} from '../data/ai-settings-repository'
import type {
  AiSettingsOverview,
  ConnectionOverview,
  RoleOverview,
} from '../domain/ai-settings-overview'
import { summarizeAiSetup, type RoleStatus } from '../domain/ai-status'
import type { RoleResolution } from '../domain/resolve-role'
import { envConnection, snapshotOf, type AiConfigDeps } from './ai-config-service'

const REQUIRED_ROLES = AI_ROLES.filter((role) => !AI_SWITCHABLE_ROLES.includes(role))

function toConnectionOverview(stored: StoredConnection): ConnectionOverview {
  const { id, name, provider, isActive, key, lastTest } = stored
  return { id, name, provider, isActive, keyHint: key?.hint ?? null, lastTest }
}

const usedConnectionOf = (resolution: RoleResolution): RoleOverview['usedConnection'] =>
  resolution.status === 'ready' ? resolution.connection : null

function toRoleOverview(
  settings: HouseholdAiSettings,
  { role, resolution }: RoleStatus,
): RoleOverview {
  const assignment = settings.assignments.find((item) => item.role === role)
  const recommendedModel = AI_ROLE_DEFAULT_MODELS[role]
  return {
    role,
    model: assignment?.model ?? recommendedModel,
    recommendedModel,
    isActive: assignment?.isActive ?? true,
    isSwitchable: AI_SWITCHABLE_ROLES.includes(role),
    assignedConnectionId: assignment?.connectionId ?? null,
    resolution: resolution.status,
    usedConnection: usedConnectionOf(resolution),
  }
}

export async function getAiSettingsOverview(
  deps: AiConfigDeps,
  householdId: string,
): Promise<AiSettingsOverview> {
  const settings = await loadHouseholdAiSettings(deps.db, householdId)
  const fromEnv = envConnection(deps.env)
  const failedConnectionIds = settings.connections
    .filter(({ lastTest }) => lastTest !== null && lastTest.status !== 'ok')
    .map(({ id }) => id)
  const summary = summarizeAiSetup({
    snapshot: snapshotOf(settings, fromEnv !== null),
    roles: AI_ROLES,
    requiredRoles: REQUIRED_ROLES,
    failedConnectionIds,
  })
  return {
    isAiEnabled: settings.isAiEnabled,
    status: summary.status,
    envConnection: fromEnv === null ? null : fromEnv.provider,
    connections: settings.connections.map(toConnectionOverview),
    roles: summary.roles.map((status) => toRoleOverview(settings, status)),
  }
}
