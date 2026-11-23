'use server'
// Mitglied entfernen (#38), nur der Admin. Ein verknüpfter Login bleibt bestehen und verliert nur
// die Verknüpfung (mitglied_id SET NULL). Die Allergien gehen mit der Person.
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { adminAccessMessage } from '@/server/auth/admin-access-message'
import { requireHouseholdAdmin } from '@/server/auth/guards'
import { MEMBERS_PATH, SETTINGS_PATH } from '@/shared/config/settings-paths'
import { readFormText } from '@/shared/lib/form-data'
import { householdServices } from '../application/household-services'
import { removeMember } from '../application/save-member'
import { memberIdSchema } from '../schemas'
import { MEMBER_GONE, type SettingState } from './action-messages'

export async function removeMemberAction(
  _previous: SettingState,
  formData: FormData,
): Promise<SettingState> {
  const admin = await requireHouseholdAdmin()
  if (!admin.ok) return { status: 'error', message: adminAccessMessage(admin.error) }
  const parsed = memberIdSchema.safeParse(readFormText(formData, 'id'))
  if (!parsed.success) return { status: 'error', message: MEMBER_GONE }
  const result = await removeMember(await householdServices(), {
    householdId: admin.value.householdId,
    memberId: parsed.data,
  })
  if (!result.ok) return { status: 'error', message: MEMBER_GONE }
  // Die Liste der Einstellungen daneben (ab „breit“) zählt die Personen
  revalidatePath(SETTINGS_PATH, 'layout')
  redirect(MEMBERS_PATH)
}
