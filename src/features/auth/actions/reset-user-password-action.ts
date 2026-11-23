'use server'
// Passwort zurücksetzen (#123), nur der Admin. Das neue Passwort steht genau einmal in dieser
// Antwort. Alle Sitzungen des Nutzers enden.
import { refresh } from 'next/cache'
import { requireHouseholdAdmin } from '@/server/auth/guards'
import { readFormText } from '@/shared/lib/form-data'
import { resetUserPassword } from '../application/reset-user-password'
import { userAdminServices } from '../application/user-admin-services'
import { chosenPasswordSchema, userIdSchema } from '../schemas'
import { PASSWORD_PROBLEM_MESSAGES, USER_GONE, accessMessage } from './user-action-messages'

export type ResetPasswordState = Readonly<{
  message: string | null
  passwordError: string | null
  revealed: Readonly<{ username: string; password: string }> | null
}>

const failure = (message: string | null, passwordError: string | null = null) => ({
  message,
  passwordError,
  revealed: null,
})

export async function resetUserPasswordAction(
  _previous: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const admin = await requireHouseholdAdmin()
  if (!admin.ok) return failure(accessMessage(admin.error))
  const userId = userIdSchema.safeParse(readFormText(formData, 'id'))
  if (!userId.success) return failure(USER_GONE)
  const password = chosenPasswordSchema.safeParse(readFormText(formData, 'passwort'))
  if (!password.success) return failure(null, password.error.issues[0]?.message ?? null)
  const result = await resetUserPassword(await userAdminServices(), {
    householdId: admin.value.householdId,
    actorId: admin.value.id,
    userId: userId.data,
    password: password.data,
  })
  if (!result.ok) {
    return result.error.kind === 'not-found'
      ? failure(USER_GONE)
      : failure(null, PASSWORD_PROBLEM_MESSAGES[result.error.problem])
  }
  refresh()
  return { message: null, passwordError: null, revealed: result.value }
}
