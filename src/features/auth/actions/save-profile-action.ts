'use server'
// Anzeigename und freiwillige Adresse für Erinnerungen speichern (#75). Jeder ändert nur sich
// selbst, die ID kommt aus der Sitzung, nie aus dem Formular.
import { refresh } from 'next/cache'
import { z } from 'zod'
import { requireUser } from '@/server/auth/guards'
import { firstMessages, readFormText } from '@/shared/lib/form-data'
import { updateOwnProfile } from '../application/manage-profile'
import { profileServices } from '../application/profile-services'
import { profileSchema } from '../schemas'
import { SIGNED_OUT, type ProfileActionState } from './profile-action-state'

export async function saveProfileAction(
  _previous: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await requireUser()
  if (!user.ok) return { status: 'error', message: SIGNED_OUT }
  const parsed = profileSchema.safeParse({
    displayName: readFormText(formData, 'name'),
    reminderEmail: readFormText(formData, 'email'),
  })
  if (!parsed.success) {
    const errors = firstMessages(z.flattenError(parsed.error).fieldErrors)
    return { status: 'error', message: null, errors }
  }
  await updateOwnProfile(await profileServices(), { userId: user.value.id, input: parsed.data })
  refresh()
  const mailNote = parsed.data.reminderEmail === null ? ' Ohne Adresse kommen keine Mails.' : ''
  return { status: 'saved', message: `Gespeichert.${mailNote}` }
}
