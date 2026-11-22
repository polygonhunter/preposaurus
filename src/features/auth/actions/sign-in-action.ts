'use server'
// Formular „Anmelden“ (UX §8.6). Die Seite folgt mit dem Design, die Action steht schon.
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { signInFromRequest } from '../application/sign-in-request'
import type { SignInError } from '../application/sign-in'
import { signInSchema } from '../schemas'

export type SignInState = Readonly<{ message: string | null }>

const WRONG_CREDENTIALS = 'Benutzername oder Passwort stimmt nicht.'

function messageFor(error: SignInError): string {
  switch (error.kind) {
    case 'invalid-credentials':
      return WRONG_CREDENTIALS
    case 'throttled':
      return `Zu viele Versuche. Bitte in ${String(error.minutes)} ${error.minutes === 1 ? 'Minute' : 'Minuten'} noch einmal.`
  }
}

function readForm(formData: FormData) {
  return signInSchema.safeParse({
    username: formData.get('benutzername'),
    password: formData.get('passwort'),
    // „Angemeldet bleiben“ ist angekreuzt der Standard (EINSTELLUNGEN §4.1)
    rememberMe: formData.get('angemeldetBleiben') !== null,
  })
}

export async function signInAction(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = readForm(formData)
  if (!parsed.success) return { message: WRONG_CREDENTIALS }
  const result = await signInFromRequest(parsed.data, await headers())
  if (!result.ok) return { message: messageFor(result.error) }
  redirect('/')
}
