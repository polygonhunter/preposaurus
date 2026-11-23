'use server'
// Standard-Ernährungsform des Haushalts speichern (HH-03), nur der Admin.
import { readFormText } from '@/shared/lib/form-data'
import { householdDietSchema } from '../schemas'
import type { SettingState } from './action-messages'
import { saveRulesChange } from './save-rules-change'

export async function saveHouseholdDietAction(
  _previous: SettingState,
  formData: FormData,
): Promise<SettingState> {
  const parsed = householdDietSchema.safeParse(readFormText(formData, 'ernaehrungsform'))
  if (!parsed.success) return { status: 'error', message: 'Bitte eine Ernährungsform wählen.' }
  return saveRulesChange({ defaultDiet: parsed.data })
}
