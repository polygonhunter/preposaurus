'use server'
// Schritt „Foto-Erkennung einrichten“ der Einrichtung (#314), nur der Admin: Schlüssel prüfen,
// Verbindung verschlüsselt anlegen, Erkennung einschalten und zum nächsten Schritt. Der Schlüssel
// steht in keiner Antwort, auch nicht bei einem Fehler. Überspringen läuft über continueSetupAction.
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { continueSetupFromRequest } from '@/features/auth/application/setup-step-request'
import { adminAccessMessage } from '@/server/auth/admin-access-message'
import { requireHouseholdAdmin } from '@/server/auth/guards'
import { firstMessages, readFormText } from '@/shared/lib/form-data'
import { aiSettingsServices } from '../application/ai-settings-services'
import { setUpRecognition } from '../application/set-up-recognition'
import { apiKeySchema } from '../schemas'
import { failed, type AiActionState } from './ai-action-state'

const setupKeySchema = z.object({ apiKey: apiKeySchema })

const NOT_SAVED = 'Das hat nicht geklappt. Bitte versucht es noch einmal.'

export async function setUpRecognitionAction(
  _previous: AiActionState,
  formData: FormData,
): Promise<AiActionState> {
  const admin = await requireHouseholdAdmin()
  if (!admin.ok) return failed(adminAccessMessage(admin.error))
  const parsed = setupKeySchema.safeParse({ apiKey: readFormText(formData, 'schluessel') })
  if (!parsed.success) {
    const errors = firstMessages(z.flattenError(parsed.error).fieldErrors)
    return { status: 'error', message: null, errors }
  }
  const { householdId, id: userId } = admin.value
  const result = await setUpRecognition(await aiSettingsServices(), {
    householdId,
    apiKey: parsed.data.apiKey,
  })
  if (!result.ok) return failed(NOT_SAVED)
  redirect(await continueSetupFromRequest(userId, 'foto-erkennung'))
}
