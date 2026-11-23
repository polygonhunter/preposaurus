'use server'
// „Weiter“, „Überspringen“, „Erledigt“ und „Später“ in den Folgeschritten der Einrichtung (#40):
// erledigt den Schritt, ohne etwas zu speichern, und führt zum nächsten oder zur Übersicht. Nur der
// Admin, der eingerichtet hat; für alle anderen geht es ohne Änderung zur Übersicht.
import { redirect } from 'next/navigation'
import { requireHouseholdAdmin } from '@/server/auth/guards'
import { readFormText } from '@/shared/lib/form-data'
import { continueSetupFromRequest } from '../application/setup-step-request'
import { DEFAULT_RETURN_PATH } from '../domain/return-path'
import { isSetupStep } from '../domain/setup-steps'

export async function continueSetupAction(formData: FormData): Promise<void> {
  const admin = await requireHouseholdAdmin()
  if (!admin.ok) redirect('/anmelden')
  const step = readFormText(formData, 'schritt')
  if (!isSetupStep(step)) redirect(DEFAULT_RETURN_PATH)
  redirect(await continueSetupFromRequest(admin.value.id, step))
}
