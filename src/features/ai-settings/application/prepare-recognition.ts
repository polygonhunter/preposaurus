// Baut für eine Erkennung den VisionRecognizer des Haushalts: je Rolle der Adapter ihrer
// Verbindung, jeder Aufruf landet in ki_aufruf. Pflichtrollen müssen eingerichtet sein, optionale
// (z. B. mhd_zweitversuch) fallen still weg, wenn sie aus sind (DATENKATALOG §8.3 Nr. 1).
import 'server-only'
import {
  createHouseholdRecognizer,
  type AiCallLog,
  type RoleRoute,
} from '@/server/ai/household-recognizer'
import { createVisionRecognizer } from '@/server/ai/create-vision-recognizer'
import type { VisionRecognizer } from '@/server/ai/vision-recognizer'
import type { AiRole } from '@/shared/config/ai-roles'
import { err, ok, type Result } from '@/shared/lib/result'
import { isPhotoOfHousehold } from '@/features/capture/application/photo-of-household'
import { insertAiCall } from '../data/ai-call-repository'
import {
  loadAiConfig,
  type AiConfigDeps,
  type AiConfigError,
  type RoleConfig,
} from './ai-config-service'

interface PrepareRecognitionInput {
  householdId: string
  photoId: string | null
  required: readonly AiRole[]
  optional?: readonly AiRole[]
}

/** Ein fremdes oder unbekanntes Foto heißt not-found, nie forbidden (DATENKATALOG §8 Nr. 3). */
type PrepareRecognitionError = AiConfigError | { kind: 'photo-not-found' }

export interface PreparedRecognition {
  recognizer: VisionRecognizer
  /** Modell je verfügbarer Rolle. Fehlt eine optionale Rolle, ist sie aus. */
  models: Partial<Record<AiRole, string>>
}

function routeFor(deps: AiConfigDeps, config: RoleConfig): RoleRoute {
  return {
    recognizer: createVisionRecognizer(deps.env, config.connection),
    connectionId: config.connectionId,
  }
}

// Die Verbindung prüft schon der zusammengesetzte Fremdschlüssel der Rollen-Zuweisung
// (verbindung_id, haushalt_id), das Foto prüft das Foto-Repository (#133, #171).
async function isForeignPhoto(deps: AiConfigDeps, input: PrepareRecognitionInput) {
  const { householdId, photoId } = input
  if (photoId === null) return false
  return !(await isPhotoOfHousehold(deps.db, { householdId, photoId }))
}

function callLog(deps: AiConfigDeps): AiCallLog {
  return { record: (entry) => insertAiCall(deps.db, entry) }
}

export async function prepareRecognition(
  deps: AiConfigDeps,
  input: PrepareRecognitionInput,
): Promise<Result<PreparedRecognition, PrepareRecognitionError>> {
  // Jeder Aufruf landet mit foto_id in ki_aufruf: Ein Foto eines anderen Haushalts käme dort hinein
  if (await isForeignPhoto(deps, input)) return err({ kind: 'photo-not-found' })
  const config = await loadAiConfig(deps, input.householdId)
  const routes: Partial<Record<AiRole, RoleRoute>> = {}
  const models: Partial<Record<AiRole, string>> = {}
  for (const role of [...input.required, ...(input.optional ?? [])]) {
    const resolved = config.forRole(role)
    if (!resolved.ok) {
      if (input.required.includes(role)) return err(resolved.error)
      continue
    }
    routes[role] = routeFor(deps, resolved.value)
    models[role] = resolved.value.model
  }
  const { householdId, photoId } = input
  const recognizer = createHouseholdRecognizer({ householdId, photoId, routes, log: callLog(deps) })
  return ok({ recognizer, models })
}
