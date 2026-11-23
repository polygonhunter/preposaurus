// Gemeinsamer Ablauf der Actions auf der Seite „Foto-Erkennung“ (#108): Admin des Haushalts prüfen,
// Dienste laden, danach die Seite neu laden.
import 'server-only'
import { refresh } from 'next/cache'
import { adminAccessMessage } from '@/server/auth/admin-access-message'
import { requireHouseholdAdmin } from '@/server/auth/guards'
import { aiSettingsServices, type AiSettingsServices } from '../application/ai-settings-services'
import { failed, type AiActionState } from './ai-action-state'

type AdminTask = (services: AiSettingsServices, householdId: string) => Promise<AiActionState>

/** Führt eine Änderung als Admin des Haushalts aus und lädt danach die Seite neu. */
export async function runAsHouseholdAdmin(task: AdminTask): Promise<AiActionState> {
  const admin = await requireHouseholdAdmin()
  if (!admin.ok) return failed(adminAccessMessage(admin.error))
  const state = await task(await aiSettingsServices(), admin.value.householdId)
  refresh()
  return state
}
