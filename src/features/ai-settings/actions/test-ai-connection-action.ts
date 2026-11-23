'use server'
// „Verbindung testen“ (#108), nur der Admin. Ein kleiner Aufruf ohne Foto, die Antwort ist ein
// ruhiger Satz ohne Schlüssel. Das Ergebnis einer Verbindung aus der App wird gespeichert.
import { readFormText } from '@/shared/lib/form-data'
import { testAiConnection } from '../application/test-ai-connection'
import { testTargetSchema } from '../schemas'
import { CONNECTION_GONE, failed, type AiActionState } from './ai-action-state'
import { runAsHouseholdAdmin } from './run-as-household-admin'

export async function testAiConnectionAction(
  _previous: AiActionState,
  formData: FormData,
): Promise<AiActionState> {
  const parsed = testTargetSchema.safeParse(readFormText(formData, 'ziel'))
  if (!parsed.success) return failed(CONNECTION_GONE)
  const connection = parsed.data === 'env' ? 'env' : { id: parsed.data }
  return runAsHouseholdAdmin(async (services, householdId) => {
    const result = await testAiConnection(services, { householdId, connection })
    if (!result.ok) return failed(CONNECTION_GONE)
    const { status, message } = result.value
    return { status: status === 'ok' ? 'saved' : 'error', message }
  })
}
