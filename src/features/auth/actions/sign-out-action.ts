'use server'
// Knopf „Abmelden“ unter Konto und Gerät (EINSTELLUNGEN_NUTZER §4.2). Danach zeigt die App die
// Anmeldung. Ohne Sitzung gibt es nichts zu beenden, die Weiterleitung kommt trotzdem.
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { signOut } from '../application/sign-out'

export async function signOutAction(): Promise<void> {
  await signOut(await headers())
  redirect('/anmelden')
}
