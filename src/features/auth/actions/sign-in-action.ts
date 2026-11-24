'use server'
// Formular „Anmelden“ (UX §8.6, ONBOARDING O-08). Nach Erfolg geht es zurück auf die Seite, die
// ohne Anmeldung aufgerufen wurde (Feld weiter, geprüft in safeReturnPath). Ist die Einrichtung
// noch offen, führt sie den Admin, der eingerichtet hat, zum offenen Schritt (#40).
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { signInFromRequest } from '../application/sign-in-request'
import { openSetupPath } from '../application/setup-step-request'
import type { SignInError } from '../application/sign-in'
import { safeReturnPath } from '../domain/return-path'
import { SIGN_IN_FAILED, signInSchema, type SignInInput } from '../schemas'
import { firstMessages, readFormText } from '@/shared/lib/form-data'

// Fehler je Feld: ein leeres Feld an sich selbst, eine falsche Anmeldung neutral am Passwort.
export type SignInState = Readonly<{
  errors: Partial<Record<keyof SignInInput, string>>
  username: string
}>

const minutesText = (minutes: number) =>
  `${String(minutes)} ${minutes === 1 ? 'Minute' : 'Minuten'}`

function messageFor(error: SignInError): string {
  switch (error.kind) {
    case 'invalid-credentials':
      return SIGN_IN_FAILED
    case 'throttled':
      return `Zu viele Versuche. Bitte in ${minutesText(error.minutes)} noch einmal. Die kurze Pause schützt euer Konto vor Durchprobieren.`
  }
}

function readForm(formData: FormData) {
  return signInSchema.safeParse({
    username: readFormText(formData, 'benutzername'),
    password: readFormText(formData, 'passwort'),
    // „Angemeldet bleiben“ ist angekreuzt der Standard (EINSTELLUNGEN §4.1)
    rememberMe: formData.get('angemeldetBleiben') !== null,
  })
}

export async function signInAction(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  // Das Passwort geht nie zurück ans Formular, der Name schon, damit er nicht neu getippt wird.
  const username = readFormText(formData, 'benutzername')
  const parsed = readForm(formData)
  if (!parsed.success) {
    return { errors: firstMessages(z.flattenError(parsed.error).fieldErrors), username }
  }
  const result = await signInFromRequest(parsed.data, await headers())
  if (!result.ok) return { errors: { password: messageFor(result.error) }, username }
  const setupPath = await openSetupPath(result.value.userId)
  redirect(setupPath ?? safeReturnPath(formData.get('weiter')))
}
