'use server'
// Modell, Verbindung und an/aus je Foto-Rolle speichern oder alle Modelle auf die Empfehlung
// zurücksetzen (#108), nur der Admin. Felder je Rolle: modell-<rolle>, verbindung-<rolle> (nur bei
// mehreren Verbindungen) und aktiv-<rolle> (nur bei abschaltbaren Rollen).
import { AI_ROLES, AI_SWITCHABLE_ROLES, type AiRole } from '@/shared/config/ai-roles'
import { readFormText } from '@/shared/lib/form-data'
import type { Result } from '@/shared/lib/result'
import {
  resetAiRolesToRecommended,
  saveAiRoles,
  type SaveAiRolesError,
} from '../application/save-ai-roles'
import { roleChoicesSchema } from '../schemas'
import { failed, saved, type AiActionState } from './ai-action-state'
import { runAsHouseholdAdmin } from './run-as-household-admin'

const RESET_INTENT = 'zuruecksetzen'

const ERRORS: Record<SaveAiRolesError['kind'], string> = {
  'no-connection': 'Bitte zuerst eine Verbindung mit Schlüssel hinzufügen.',
  'connection-not-found': 'Diese Verbindung gibt es nicht mehr. Bitte lade die Seite neu.',
}

function readChoice(formData: FormData, role: AiRole) {
  const connectionId = readFormText(formData, `verbindung-${role}`)
  const isSwitchable = AI_SWITCHABLE_ROLES.includes(role)
  return {
    role,
    model: readFormText(formData, `modell-${role}`),
    connectionId: connectionId === '' ? null : connectionId,
    isActive: !isSwitchable || readFormText(formData, `aktiv-${role}`) === 'an',
  }
}

function toState(result: Result<null, SaveAiRolesError>, message: string): AiActionState {
  return result.ok ? saved(message) : failed(ERRORS[result.error.kind])
}

export async function saveAiRolesAction(
  _previous: AiActionState,
  formData: FormData,
): Promise<AiActionState> {
  if (readFormText(formData, 'aktion') === RESET_INTENT) {
    return runAsHouseholdAdmin(async (services, householdId) =>
      toState(
        await resetAiRolesToRecommended(services, householdId),
        'Alle Modelle stehen wieder auf der Empfehlung.',
      ),
    )
  }
  const parsed = roleChoicesSchema.safeParse(AI_ROLES.map((role) => readChoice(formData, role)))
  if (!parsed.success) return failed('Bitte für jede Rolle ein Modell wählen.')
  return runAsHouseholdAdmin(async (services, householdId) =>
    toState(await saveAiRoles(services, { householdId, choices: parsed.data }), 'Gespeichert.'),
  )
}
