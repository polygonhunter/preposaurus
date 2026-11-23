'use server'
// „Noch gut zählt mit“ speichern (#117), nur der Admin. Ein Schalter schickt „an“, wenn er an ist,
// und sonst nichts.
import { readFormText } from '@/shared/lib/form-data'
import type { SettingState } from './action-messages'
import { saveRulesChange } from './save-rules-change'

export async function saveStillGoodAction(
  _previous: SettingState,
  formData: FormData,
): Promise<SettingState> {
  return saveRulesChange({ stillGoodCounts: readFormText(formData, 'noch-gut') === 'an' })
}
