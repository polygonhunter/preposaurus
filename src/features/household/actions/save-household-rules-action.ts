'use server'
// Standard-Ernährungsform (HH-03) und „Noch gut zählt mit“ (#117) speichern, nur der Admin. Je
// Formular eine Einstellung: Das Feld, das fehlt, bleibt, wie es ist.
import { refresh } from 'next/cache'
import { requireHouseholdAdmin } from '@/server/auth/guards'
import { readFormText } from '@/shared/lib/form-data'
import { householdServices } from '../application/household-services'
import { updateHouseholdRules } from '../application/update-household-rules'
import { householdDietSchema } from '../schemas'
import { accessMessage, type SettingState } from './action-messages'

const SAVED: SettingState = { status: 'saved', message: 'Gespeichert.' }

async function saveChange(change: Parameters<typeof updateHouseholdRules>[1]['change']) {
  const admin = await requireHouseholdAdmin()
  if (!admin.ok) return { status: 'error', message: accessMessage(admin.error) } as const
  await updateHouseholdRules(await householdServices(), {
    householdId: admin.value.householdId,
    change,
  })
  // Die Seite zeigt danach den gespeicherten Stand, auch nach dem Zurücksetzen des Formulars.
  refresh()
  return SAVED
}

export async function saveHouseholdDietAction(
  _previous: SettingState,
  formData: FormData,
): Promise<SettingState> {
  const parsed = householdDietSchema.safeParse(readFormText(formData, 'ernaehrungsform'))
  if (!parsed.success) return { status: 'error', message: 'Bitte eine Ernährungsform wählen.' }
  return saveChange({ defaultDiet: parsed.data })
}

// Ein Schalter schickt „an“, wenn er an ist, und sonst nichts.
export async function saveStillGoodAction(
  _previous: SettingState,
  formData: FormData,
): Promise<SettingState> {
  return saveChange({ stillGoodCounts: readFormText(formData, 'noch-gut') === 'an' })
}
