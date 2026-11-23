'use server'
// Verbindung entfernen (#108), nur der Admin. Ihre Rollen wandern zu einer anderen Verbindung mit
// Schlüssel oder gelten danach als nicht eingerichtet.
import { readFormText } from '@/shared/lib/form-data'
import { removeAiConnection } from '../application/manage-ai-connection'
import { connectionIdSchema } from '../schemas'
import { CONNECTION_GONE, failed, saved, type AiActionState } from './ai-action-state'
import { runAsHouseholdAdmin } from './run-as-household-admin'

export async function removeAiConnectionAction(
  _previous: AiActionState,
  formData: FormData,
): Promise<AiActionState> {
  const parsed = connectionIdSchema.safeParse(readFormText(formData, 'id'))
  if (!parsed.success) return failed(CONNECTION_GONE)
  return runAsHouseholdAdmin(async (services, householdId) => {
    const result = await removeAiConnection(services, { householdId, connectionId: parsed.data })
    return result.ok ? saved('Die Verbindung ist entfernt.') : failed(CONNECTION_GONE)
  })
}
