'use server'
// Foto-Erkennung für den Haushalt an- oder ausschalten (#79), nur der Admin. Ein Schalter schickt
// „an“, wenn er an ist, und sonst nichts.
import { readFormText } from '@/shared/lib/form-data'
import { setAiEnabled } from '../application/manage-ai-connection'
import { saved, type AiActionState } from './ai-action-state'
import { runAsHouseholdAdmin } from './run-as-household-admin'

export async function saveAiEnabledAction(
  _previous: AiActionState,
  formData: FormData,
): Promise<AiActionState> {
  const isEnabled = readFormText(formData, 'ki') === 'an'
  return runAsHouseholdAdmin(async (services, householdId) => {
    await setAiEnabled(services, { householdId, isEnabled })
    return saved(isEnabled ? 'Die Foto-Erkennung ist an.' : 'Die Foto-Erkennung ist aus.')
  })
}
