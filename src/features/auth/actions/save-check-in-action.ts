'use server'
// Check-in-Mail für sich selbst wählen (#89): aus, wöchentlich oder monatlich. Einschalten geht
// nur mit eingerichtetem Mailversand und eigener Adresse.
import { refresh } from 'next/cache'
import { requireUser } from '@/server/auth/guards'
import { readFormText } from '@/shared/lib/form-data'
import { saveOwnCheckIn } from '../application/manage-profile'
import { profileServices } from '../application/profile-services'
import { checkInChoiceSchema } from '../schemas'
import { SIGNED_OUT, type ProfileActionState } from './profile-action-state'

export async function saveCheckInAction(
  _previous: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await requireUser()
  if (!user.ok) return { status: 'error', message: SIGNED_OUT }
  const parsed = checkInChoiceSchema.safeParse(readFormText(formData, 'checkin'))
  if (!parsed.success) return { status: 'error', message: parsed.error.issues[0]?.message ?? null }
  const result = await saveOwnCheckIn(await profileServices(), {
    userId: user.value.id,
    choice: parsed.data,
  })
  if (!result.ok) {
    return {
      status: 'error',
      message: 'Dafür braucht es eine eigene Adresse und einen eingerichteten Mailversand.',
    }
  }
  refresh()
  return { status: 'saved', message: 'Gespeichert.' }
}
