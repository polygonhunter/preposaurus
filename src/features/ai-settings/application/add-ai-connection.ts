// Verbindung hinzufügen aus den Einstellungen (#108): Name prüfen, Schlüssel verschlüsselt speichern
// (createAiConnection) und jeder Rolle ohne Zuweisung die neue Verbindung mit dem empfohlenen Modell
// geben. So ist die Foto-Erkennung mit dem ersten Schlüssel eingerichtet, ohne jede Rolle einzeln
// anzufassen. Vorhandene Zuweisungen bleiben, wie sie sind.
import 'server-only'
import { AI_ROLE_DEFAULT_MODELS, AI_ROLES } from '@/shared/config/ai-roles'
import type { AI_PROVIDERS } from '@/shared/config/constants'
import { err, ok, type Result } from '@/shared/lib/result'
import { hasConnectionNamed, insertMissingAssignments } from '../data/ai-settings-writes'
import type { AiConfigDeps } from './ai-config-service'
import { createAiConnection, type CreatedAiConnection } from './create-ai-connection'

interface AddAiConnectionInput {
  householdId: string
  provider: (typeof AI_PROVIDERS)[number]
  name: string
  apiKey: string
}

export interface AddAiConnectionError {
  kind: 'name-taken'
}

export async function addAiConnection(
  deps: AiConfigDeps,
  input: AddAiConnectionInput,
): Promise<Result<CreatedAiConnection, AddAiConnectionError>> {
  const { householdId } = input
  if (await hasConnectionNamed(deps.db, householdId, input.name)) return err({ kind: 'name-taken' })
  const created = await createAiConnection(deps, input)
  const assignments = AI_ROLES.map((role) => ({
    role,
    connectionId: created.id,
    model: AI_ROLE_DEFAULT_MODELS[role],
    isActive: true,
  }))
  await insertMissingAssignments(deps.db, householdId, assignments)
  return ok(created)
}
