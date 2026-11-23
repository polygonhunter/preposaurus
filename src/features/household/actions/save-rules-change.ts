// Gemeinsamer Ablauf der Regel-Formulare (HH-03, #117): Admin prüfen, die eine Einstellung
// speichern, die Seite neu laden. Das Feld, das fehlt, bleibt, wie es ist.
import 'server-only'
import { refresh } from 'next/cache'
import { adminAccessMessage } from '@/server/auth/admin-access-message'
import { requireHouseholdAdmin } from '@/server/auth/guards'
import { householdServices } from '../application/household-services'
import { updateHouseholdRules } from '../application/update-household-rules'
import type { SettingState } from './action-messages'

type RulesChange = Parameters<typeof updateHouseholdRules>[1]['change']

const SAVED: SettingState = { status: 'saved', message: 'Gespeichert.' }

export async function saveRulesChange(change: RulesChange): Promise<SettingState> {
  const admin = await requireHouseholdAdmin()
  if (!admin.ok) return { status: 'error', message: adminAccessMessage(admin.error) }
  await updateHouseholdRules(await householdServices(), {
    householdId: admin.value.householdId,
    change,
  })
  // Die Seite zeigt danach den gespeicherten Stand, auch nach dem Zurücksetzen des Formulars.
  refresh()
  return SAVED
}
