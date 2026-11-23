'use server'
// Nutzer anlegen (#123), nur der Admin. Das Passwort steht genau einmal in dieser Antwort und nie in
// der Adresse oder im Log. Die übrigen Eingaben kommen nach einem Fehler zurück, das Passwort nicht.
import { z } from 'zod'
import { requireHouseholdAdmin } from '@/server/auth/guards'
import { firstMessages, readFormText } from '@/shared/lib/form-data'
import { createUser, type CreateUserError } from '../application/create-user'
import { userAdminServices } from '../application/user-admin-services'
import { createUserSchema, type CreateUserInput } from '../schemas'
import { PASSWORD_PROBLEM_MESSAGES, accessMessage } from './user-action-messages'

type CreateUserField = keyof CreateUserInput

type FormTexts = Readonly<Record<Exclude<CreateUserField, 'password'>, string>>

export type CreateUserState = Readonly<{
  errors: Partial<Record<CreateUserField, string>>
  message: string | null
  values: FormTexts | null
  created: Readonly<{ username: string; password: string }> | null
}>

function readForm(formData: FormData) {
  return {
    displayName: readFormText(formData, 'anzeigename'),
    username: readFormText(formData, 'benutzername'),
    role: readFormText(formData, 'rolle'),
    memberId: readFormText(formData, 'person'),
  }
}

function errorFields(error: CreateUserError): CreateUserState['errors'] {
  switch (error.kind) {
    case 'username-taken':
      return { username: 'Diesen Benutzernamen gibt es schon. Bitte wähle einen anderen.' }
    case 'member-not-found':
      return { memberId: 'Diese Person gibt es nicht mehr. Bitte wähle neu.' }
    case 'password':
      return { password: PASSWORD_PROBLEM_MESSAGES[error.problem] }
  }
}

const failure = (values: FormTexts, errors: CreateUserState['errors'], message: string | null) => ({
  errors,
  message,
  values,
  created: null,
})

export async function createUserAction(
  _previous: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  const values = readForm(formData)
  const admin = await requireHouseholdAdmin()
  if (!admin.ok) return failure(values, {}, accessMessage(admin.error))
  const parsed = createUserSchema.safeParse({
    ...values,
    password: readFormText(formData, 'passwort'),
  })
  if (!parsed.success) {
    return failure(values, firstMessages(z.flattenError(parsed.error).fieldErrors), null)
  }
  const result = await createUser(await userAdminServices(), {
    householdId: admin.value.householdId,
    actorId: admin.value.id,
    input: parsed.data,
  })
  if (!result.ok) return failure(values, errorFields(result.error), null)
  const { username, password } = result.value
  return { errors: {}, message: null, values: null, created: { username, password } }
}
