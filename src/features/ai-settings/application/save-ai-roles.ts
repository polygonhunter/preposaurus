// Modell, Verbindung und an/aus je Foto-Rolle speichern (#108). Eine Zuweisung braucht immer eine
// Verbindung aus der App (Fremdschlüssel). Ohne Angabe bleibt die bisherige, sonst gilt die erste
// Verbindung mit Schlüssel. Pflichtrollen bleiben immer an. „Auf Empfehlung zurücksetzen“ setzt nur
// die Modelle zurück, Verbindung und an/aus bleiben.
import 'server-only'
import {
  AI_ROLE_DEFAULT_MODELS,
  AI_ROLES,
  AI_SWITCHABLE_ROLES,
  type AiRole,
} from '@/shared/config/ai-roles'
import { err, ok, type Result } from '@/shared/lib/result'
import { loadHouseholdAiSettings, type HouseholdAiSettings } from '../data/ai-settings-repository'
import { saveAssignments } from '../data/ai-settings-writes'
import type { RoleAssignment } from '../domain/resolve-role'
import type { AiConfigDeps } from './ai-config-service'

export interface RoleChoice {
  role: AiRole
  model: string
  /** null: bisherige Verbindung behalten */
  connectionId: string | null
  isActive: boolean
}

export interface SaveAiRolesError {
  kind: 'no-connection' | 'connection-not-found'
}

type Deps = Pick<AiConfigDeps, 'db'>

function defaultConnectionId(settings: HouseholdAiSettings): string | null {
  return settings.connections.find(({ key, isActive }) => key !== null && isActive)?.id ?? null
}

function toAssignment(
  settings: HouseholdAiSettings,
  choice: RoleChoice,
): Result<RoleAssignment, SaveAiRolesError> {
  const current = settings.assignments.find(({ role }) => role === choice.role)
  const connectionId = choice.connectionId ?? current?.connectionId ?? defaultConnectionId(settings)
  if (connectionId === null) return err({ kind: 'no-connection' })
  if (!settings.connections.some(({ id }) => id === connectionId)) {
    return err({ kind: 'connection-not-found' })
  }
  const isActive = AI_SWITCHABLE_ROLES.includes(choice.role) ? choice.isActive : true
  return ok({ role: choice.role, model: choice.model, connectionId, isActive })
}

export async function saveAiRoles(
  deps: Deps,
  input: Readonly<{ householdId: string; choices: readonly RoleChoice[] }>,
): Promise<Result<null, SaveAiRolesError>> {
  const settings = await loadHouseholdAiSettings(deps.db, input.householdId)
  const assignments: RoleAssignment[] = []
  for (const choice of input.choices) {
    const assignment = toAssignment(settings, choice)
    if (!assignment.ok) return assignment
    assignments.push(assignment.value)
  }
  await saveAssignments(deps.db, input.householdId, assignments)
  return ok(null)
}

export async function resetAiRolesToRecommended(
  deps: Deps,
  householdId: string,
): Promise<Result<null, SaveAiRolesError>> {
  const settings = await loadHouseholdAiSettings(deps.db, householdId)
  const choices = AI_ROLES.map((role) => {
    const current = settings.assignments.find((item) => item.role === role)
    const model = AI_ROLE_DEFAULT_MODELS[role]
    return { role, model, connectionId: null, isActive: current?.isActive ?? true }
  })
  return saveAiRoles(deps, { householdId, choices })
}
