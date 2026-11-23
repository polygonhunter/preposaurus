'use server'
// Verbindung mit Schlüssel hinzufügen (#108), nur der Admin. Der Schlüssel geht nur verschlüsselt in
// die DB und kommt in keiner Antwort zurück, auch nicht bei einem Fehler.
import { z } from 'zod'
import { firstMessages, readFormText } from '@/shared/lib/form-data'
import { addAiConnection } from '../application/add-ai-connection'
import { newConnectionSchema } from '../schemas'
import { type AiActionState } from './ai-action-state'
import { runAsHouseholdAdmin } from './run-as-household-admin'

const NAME_TAKEN = 'Diesen Namen gibt es schon.'

export async function addAiConnectionAction(
  _previous: AiActionState,
  formData: FormData,
): Promise<AiActionState> {
  const name = readFormText(formData, 'name')
  const apiKey = readFormText(formData, 'schluessel')
  const parsed = newConnectionSchema.safeParse({ name, apiKey })
  if (!parsed.success) {
    const errors = firstMessages(z.flattenError(parsed.error).fieldErrors)
    return { status: 'error', message: null, errors, name }
  }
  return runAsHouseholdAdmin(async (services, householdId) => {
    const input = { householdId, provider: 'anthropic' as const, ...parsed.data }
    const result = await addAiConnection(services, input)
    if (!result.ok) return { status: 'error', message: null, errors: { name: NAME_TAKEN }, name }
    const { keyHint } = result.value
    return { status: 'saved', message: `Gespeichert. Der Schlüssel endet auf ${keyHint}.` }
  })
}
