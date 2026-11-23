'use server'
// Passwort zurücksetzen (#123), nur der Admin. Das neue Passwort steht genau einmal in dieser
// Antwort. Alle Sitzungen des Nutzers enden.
import { refresh } from 'next/cache'
import { adminAccessMessage } from '@/server/auth/admin-access-message'
import { requireHouseholdAdmin } from '@/server/auth/guards'
import { readFormText } from '@/shared/lib/form-data'
import { resetUserPassword, type ResetUserPasswordError } from '../application/reset-user-password'
import { userAdminServices } from '../application/user-admin-services'
import { chosenPasswordSchema, userIdSchema } from '../schemas'
import { OWN_PASSWORD, PASSWORD_PROBLEM_MESSAGES, USER_GONE } from './user-action-messages'

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

function errorState(error: ResetUserPasswordError): ResetPasswordState {
  switch (error.kind) {
    case 'not-found':
      return failure(USER_GONE)
    case 'self':
      return failure(OWN_PASSWORD)
    case 'password':
      return failure(null, PASSWORD_PROBLEM_MESSAGES[error.problem])
  }
}

export async function resetUserPasswordAction(
  _previous: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const admin = await requireHouseholdAdmin()
  if (!admin.ok) return failure(adminAccessMessage(admin.error))
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
  if (!result.ok) return errorState(result.error)
  refresh()
  return { message: null, passwordError: null, revealed: result.value }
}
