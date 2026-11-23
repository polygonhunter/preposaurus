// Wahl „Tastenkürzel“ (#254, WCAG 2.1.4) je Browser im Cookie statt in der DB: keine Migration, und
// die Wahl passt zum Gerät (am Handy ohne Tastatur spielt sie keine Rolle). Der Layout liest sie bei
// jeder Anfrage, deshalb rendert schon der Server ohne `kbd` und `aria-keyshortcuts`.
import 'server-only'
import { cookies } from 'next/headers'
import {
  areShortcutsEnabled,
  SHORTCUTS_COOKIE,
  SHORTCUTS_OFF,
} from '@/shared/lib/keyboard-shortcuts'

// Ein Jahr; Browser kappen Cookies ohnehin bei rund 400 Tagen.
const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60

export async function readShortcutsEnabled(): Promise<boolean> {
  return areShortcutsEnabled((await cookies()).get(SHORTCUTS_COOKIE)?.value)
}

/** Nur aus einer Server Action aufrufen: Cookies lassen sich nur dort setzen. */
export async function saveShortcutsEnabled(isEnabled: boolean): Promise<void> {
  const store = await cookies()
  if (isEnabled) {
    store.delete(SHORTCUTS_COOKIE)
    return
  }
  store.set(SHORTCUTS_COOKIE, SHORTCUTS_OFF, {
    maxAge: ONE_YEAR_SECONDS,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })
}
