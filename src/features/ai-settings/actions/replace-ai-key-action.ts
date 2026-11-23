'use server'
// Schlüssel einer Verbindung ersetzen (#108), nur der Admin. Der alte Teststatus fällt weg.
import { z } from 'zod'
import { firstMessages, readFormText } from '@/shared/lib/form-data'
import { replaceAiKey } from '../application/manage-ai-connection'
import { apiKeySchema, connectionIdSchema } from '../schemas'
import { CONNECTION_GONE, failed, type AiActionState } from './ai-action-state'
import { runAsHouseholdAdmin } from './run-as-household-admin'

const replaceKeySchema = z.object({ connectionId: connectionIdSchema, apiKey: apiKeySchema })

export async function replaceAiKeyAction(
  _previous: AiActionState,
  formData: FormData,
): Promise<AiActionState> {
  const parsed = replaceKeySchema.safeParse({
    connectionId: readFormText(formData, 'id'),
    apiKey: readFormText(formData, 'schluessel'),
  })
  if (!parsed.success) {
    const { connectionId, apiKey } = firstMessages(z.flattenError(parsed.error).fieldErrors)
    if (connectionId !== undefined) return failed(CONNECTION_GONE)
    return { status: 'error', message: null, errors: apiKey === undefined ? {} : { apiKey } }
  }
  return runAsHouseholdAdmin(async (services, householdId) => {
    const result = await replaceAiKey(services, { householdId, ...parsed.data })
    if (!result.ok) return failed(CONNECTION_GONE)
    const { keyHint } = result.value
    return { status: 'saved', message: `Ersetzt. Der Schlüssel endet auf ${keyHint}.` }
  })
}
