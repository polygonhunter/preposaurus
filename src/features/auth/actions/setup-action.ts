'use server'
// Formular „Willkommen“ der Ersteinrichtung (#34, ONBOARDING O-02). Nach dem Anlegen meldet die
// Action den neuen Admin gleich an („Angemeldet bleiben“ an) und führt zur Übersicht. Kommt ein
// zweiter Aufruf zu spät, geht es zur Anmeldung: Dann hat jemand anderes schon eingerichtet.
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { setupFromRequest } from '../application/setup-request'
import { signInFromRequest } from '../application/sign-in-request'
import { findPasswordProblem, type PasswordProblem } from '../domain/password-rules'
import { DEFAULT_RETURN_PATH } from '../domain/return-path'
import { setupSchema, type SetupInput } from '../schemas'
import { firstMessages, readFormText } from '@/shared/lib/form-data'

type SetupField = 'username' | 'password' | 'passwordRepeat' | 'householdName'

export type SetupState = Readonly<{
  errors: Partial<Record<SetupField, string>>
  // Passwörter gehen nie zurück ans Formular
  values: Readonly<{ username: string; householdName: string }>
}>

const PASSWORD_PROBLEM_MESSAGES: Record<PasswordProblem, string> = {
  'contains-app-name': 'Bitte ein Passwort ohne „Preposaurus“.',
  'contains-username': 'Bitte ein Passwort ohne den Benutzernamen.',
  'contains-household-name': 'Bitte ein Passwort ohne den Namen des Haushalts.',
}

function readForm(formData: FormData) {
  return {
    username: readFormText(formData, 'benutzername'),
    password: readFormText(formData, 'passwort'),
    passwordRepeat: readFormText(formData, 'passwortWiederholen'),
    householdName: readFormText(formData, 'haushaltsname'),
  }
}

type Validation = { input: SetupInput } | { errors: SetupState['errors'] }

function validate(raw: ReturnType<typeof readForm>): Validation {
  const parsed = setupSchema.safeParse(raw)
  if (!parsed.success) return { errors: firstMessages(z.flattenError(parsed.error).fieldErrors) }
  const problem = findPasswordProblem(parsed.data.password, parsed.data)
  if (problem === null) return { input: parsed.data }
  return { errors: { password: PASSWORD_PROBLEM_MESSAGES[problem] } }
}

export async function setupAction(_previous: SetupState, formData: FormData): Promise<SetupState> {
  const raw = readForm(formData)
  const validation = validate(raw)
  if ('errors' in validation) {
    return {
      errors: validation.errors,
      values: { username: raw.username, householdName: raw.householdName },
    }
  }
  const { input } = validation
  const result = await setupFromRequest(input)
  if (!result.ok) redirect('/anmelden')
  const signIn = await signInFromRequest(
    { username: input.username, password: input.password, rememberMe: true },
    await headers(),
  )
  redirect(signIn.ok ? DEFAULT_RETURN_PATH : '/anmelden')
}
