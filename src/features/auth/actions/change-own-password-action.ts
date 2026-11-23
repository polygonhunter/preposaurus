'use server'
// Eigenes Passwort ändern (#75, EINSTELLUNGEN_NUTZER §3.2): das alte ist Pflicht, das neue folgt den
// Regeln aus §4.4. Andere Geräte abmelden ist vorgewählt. Kein Passwort steht je in der Antwort.
import { refresh } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'
import { requireUser } from '@/server/auth/guards'
import { firstMessages, readFormText } from '@/shared/lib/form-data'
import { changeOwnPassword, type ChangePasswordError } from '../application/manage-profile'
import { profileServices } from '../application/profile-services'
import { changePasswordSchema } from '../schemas'
import { SIGNED_OUT, type ProfileActionState } from './profile-action-state'
import { PASSWORD_PROBLEM_MESSAGES } from './user-action-messages'

function errorState(error: ChangePasswordError): ProfileActionState {
  const errors =
    error.kind === 'wrong-password'
      ? { currentPassword: 'Das bisherige Passwort stimmt nicht.' }
      : { newPassword: PASSWORD_PROBLEM_MESSAGES[error.problem] }
  return { status: 'error', message: null, errors }
}

export async function changeOwnPasswordAction(
  _previous: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await requireUser()
  if (!user.ok) return { status: 'error', message: SIGNED_OUT }
  const parsed = changePasswordSchema.safeParse({
    currentPassword: readFormText(formData, 'altes-passwort'),
    newPassword: readFormText(formData, 'neues-passwort'),
    endOtherSessions: readFormText(formData, 'andere-abmelden') === 'an',
  })
  if (!parsed.success) {
    const errors = firstMessages(z.flattenError(parsed.error).fieldErrors)
    return { status: 'error', message: null, errors }
  }
  const result = await changeOwnPassword(await profileServices(), {
    userId: user.value.id,
    headers: await headers(),
    input: parsed.data,
  })
  if (!result.ok) return errorState(result.error)
  refresh()
  const others = parsed.data.endOtherSessions ? ' Andere Geräte sind abgemeldet.' : ''
  return { status: 'saved', message: `Dein Passwort ist geändert.${others}` }
}
