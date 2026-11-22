// Zentraler Konfigurations-Service der KI (#108, DATENKATALOG §8.3): liefert je Foto-Rolle
// Verbindung, entschlüsselten Schlüssel und Modell. Der Adapter liest weder env noch DB selbst.
// Vorrang hat ANTHROPIC_API_KEY als feste Verbindung „aus Umgebungsvariable“ (Regel in
// domain/resolve-role.ts). Der Schlüssel verlässt diesen Service nur als SecretValue.
import 'server-only'
import type { ProviderConnection } from '@/server/ai/create-vision-recognizer'
import { decryptSecret } from '@/server/crypto/secret-box'
import { SecretValue } from '@/server/crypto/secret-value'
import type { Database } from '@/server/db/connection'
import { AI_ROLE_DEFAULT_MODELS, type AiRole } from '@/shared/config/ai-roles'
import type { Env } from '@/shared/config/env'
import { err, ok, type Result } from '@/shared/lib/result'
import {
  loadHouseholdAiSettings,
  type HouseholdAiSettings,
  type StoredConnection,
} from '../data/ai-settings-repository'
import { resolveRole, type RoleUnavailable } from '../domain/resolve-role'

export type AiConfigEnv = Pick<Env, 'APP_SECRET' | 'ANTHROPIC_API_KEY' | 'AI_PROVIDER'>

export interface AiConfigDeps {
  db: Database
  env: AiConfigEnv
}

export interface RoleConfig {
  role: AiRole
  model: string
  /** null bei der Verbindung „aus Umgebungsvariable“ */
  connectionId: string | null
  connection: ProviderConnection
}

/** key-unreadable: APP_SECRET hat sich geändert oder das Chiffrat ist beschädigt */
export interface AiConfigError {
  kind: RoleUnavailable | 'key-unreadable'
}

export interface HouseholdAiConfig {
  forRole: (role: AiRole) => Result<RoleConfig, AiConfigError>
}

export function envConnection(env: AiConfigEnv): ProviderConnection | null {
  if (env.ANTHROPIC_API_KEY === undefined) return null
  return { provider: 'anthropic', apiKey: new SecretValue(env.ANTHROPIC_API_KEY), baseUrl: null }
}

export function decryptConnection(
  env: AiConfigEnv,
  stored: StoredConnection,
): Result<ProviderConnection, AiConfigError> {
  if (stored.key === null) return err({ kind: 'not-configured' })
  const context = { appSecret: env.APP_SECRET, associatedData: stored.id }
  const apiKey = decryptSecret(stored.key, context)
  if (!apiKey.ok) return err({ kind: 'key-unreadable' })
  return ok({ provider: stored.provider, apiKey: apiKey.value, baseUrl: stored.baseUrl })
}

function snapshotOf(settings: HouseholdAiSettings, hasEnvConnection: boolean) {
  const connections = settings.connections.map(({ id, isActive, key }) => ({
    id,
    isActive,
    hasKey: key !== null,
  }))
  const { isAiEnabled, assignments } = settings
  return {
    isAiEnabled,
    hasEnvConnection,
    connections,
    assignments,
    recommendedModels: AI_ROLE_DEFAULT_MODELS,
  }
}

function configFor(
  env: AiConfigEnv,
  settings: HouseholdAiSettings,
  role: AiRole,
): Result<RoleConfig, AiConfigError> {
  const fromEnv = envConnection(env)
  const resolution = resolveRole(snapshotOf(settings, fromEnv !== null), role)
  if (resolution.status !== 'ready') return err({ kind: resolution.status })
  const { model, connection: source } = resolution
  if (source.source === 'env') {
    if (fromEnv === null) return err({ kind: 'not-configured' })
    return ok({ role, model, connectionId: null, connection: fromEnv })
  }
  const stored = settings.connections.find((item) => item.id === source.connectionId)
  if (stored === undefined) return err({ kind: 'connection-inactive' })
  const connection = decryptConnection(env, stored)
  if (!connection.ok) return connection
  return ok({ role, model, connectionId: stored.id, connection: connection.value })
}

/** Liest einmal je Anfrage, entschlüsselt erst, wenn eine Rolle tatsächlich gebraucht wird. */
export async function loadAiConfig(
  deps: AiConfigDeps,
  householdId: string,
): Promise<HouseholdAiConfig> {
  const settings = await loadHouseholdAiSettings(deps.db, householdId)
  return { forRole: (role) => configFor(deps.env, settings, role) }
}
