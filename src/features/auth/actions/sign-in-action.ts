'use server'
// Formular „Anmelden“ (UX §8.6, ONBOARDING O-08). Nach Erfolg geht es zurück auf die Seite, die
// ohne Anmeldung aufgerufen wurde (Feld weiter, geprüft in safeReturnPath).
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { signInFromRequest } from '../application/sign-in-request'
import type { SignInError } from '../application/sign-in'
import { safeReturnPath } from '../domain/return-path'
import { signInSchema } from '../schemas'
import { readFormText } from '@/shared/lib/form-data'

export type SignInState = Readonly<{ message: string | null; username: string }>

const WRONG_CREDENTIALS = 'Benutzername oder Passwort stimmt nicht.'

const minutesText = (minutes: number) =>
  `${String(minutes)} ${minutes === 1 ? 'Minute' : 'Minuten'}`

function messageFor(error: SignInError): string {
  switch (error.kind) {
    case 'invalid-credentials':
      return WRONG_CREDENTIALS
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
  if (!parsed.success) return { message: WRONG_CREDENTIALS, username }
  const result = await signInFromRequest(parsed.data, await headers())
  if (!result.ok) return { message: messageFor(result.error), username }
  redirect(safeReturnPath(formData.get('weiter')))
}
