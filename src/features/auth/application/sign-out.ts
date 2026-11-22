// Abmelden (EINSTELLUNGEN_NUTZER §4.2): beendet die Sitzung dieses Geräts und löscht ihr Cookie.
// Das Push-Abo des Geräts löscht dieser Use-Case mit M11, sobald es Push gibt.
import 'server-only'
import type { Auth } from '@/server/auth/auth'
import { getAuth } from '@/server/auth/get-auth'

/** Ohne Angabe nutzt der Use-Case die Instanz des Servers, Tests geben ihre eigene mit. */
export async function signOut(headers: Headers, auth?: Auth): Promise<void> {
  const instance = auth ?? (await getAuth())
  // Ohne gültige Sitzung gibt es nichts zu beenden.
  const session = await instance.api.getSession({ headers, query: { disableCookieCache: true } })
  if (session === null) return
  await instance.api.signOut({ headers })
}
