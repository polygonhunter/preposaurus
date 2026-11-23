'use server'
// Ersteinrichtung, Schritt „Willkommen und Konto“ (#34, ONBOARDING §2.2). Nach dem Anlegen meldet
// die Action den neuen Admin gleich an („Angemeldet bleiben“ an) und führt zum nächsten Schritt
// „Mitglieder“ (#40). Kommt ein zweiter Aufruf zu spät, geht es zur Anmeldung: Dann hat jemand
// anderes schon eingerichtet.
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { setupFromRequest } from '../application/setup-request'
import { signInFromRequest } from '../application/sign-in-request'
import { findPasswordProblem, type PasswordProblem } from '../domain/password-rules'
import { setupSchema, type SetupInput } from '../schemas'
import { DEFAULT_HOUSEHOLD_NAME } from '@/shared/config/constants'
import { SETUP_MEMBERS_PATH } from '@/shared/config/setup-paths'
import { firstMessages, readFormText } from '@/shared/lib/form-data'

type SetupField = keyof SetupInput

// Die Eingaben behält das Formular selbst, das Passwort geht nie zurück.
export type SetupState = Readonly<{ errors: Partial<Record<SetupField, string>> }>

const PASSWORD_PROBLEM_MESSAGES: Record<PasswordProblem, string> = {
  'contains-app-name': 'Bitte ein Passwort ohne „Preposaurus“.',
  'contains-username': 'Bitte ein Passwort ohne den Benutzernamen.',
  'contains-display-name': 'Bitte ein Passwort ohne deinen Namen.',
  'contains-household-name': `Bitte ein Passwort ohne „${DEFAULT_HOUSEHOLD_NAME}“.`,
}

function readForm(formData: FormData) {
  return {
    displayName: readFormText(formData, 'anzeigename'),
    username: readFormText(formData, 'benutzername'),
    password: readFormText(formData, 'passwort'),
  }
}

type Validation = { input: SetupInput } | SetupState

function validate(formData: FormData): Validation {
  const parsed = setupSchema.safeParse(readForm(formData))
  if (!parsed.success) return { errors: firstMessages(z.flattenError(parsed.error).fieldErrors) }
  const problem = findPasswordProblem(parsed.data.password, {
    ...parsed.data,
    householdName: DEFAULT_HOUSEHOLD_NAME,
  })
  if (problem === null) return { input: parsed.data }
  return { errors: { password: PASSWORD_PROBLEM_MESSAGES[problem] } }
}

export async function setupAction(_previous: SetupState, formData: FormData): Promise<SetupState> {
  const validation = validate(formData)
  if ('errors' in validation) return validation
  const { input } = validation
  const result = await setupFromRequest(input)
  if (!result.ok) redirect('/anmelden')
  const signIn = await signInFromRequest(
    { username: input.username, password: input.password, rememberMe: true },
    await headers(),
  )
  redirect(signIn.ok ? SETUP_MEMBERS_PATH : '/anmelden')
}
