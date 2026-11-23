// Helfer für jede Server Action und Route (EINSTELLUNGEN_NUTZER §5): Sitzung und Rolle werden je
// Aufruf aus der DB geprüft, auch bei Direktaufruf. Erwartete Fehler sind Rückgabewerte.
import 'server-only'
import { headers } from 'next/headers'
import { err, ok, type Result } from '@/shared/lib/result'
import { getAuth } from './get-auth'
import { readSession, type SessionUser } from './session'

export type AccessError = { kind: 'unauthenticated' } | { kind: 'forbidden' }

export async function requireUser(): Promise<Result<SessionUser, AccessError>> {
  // headers() zuerst: Das macht die Seite dynamisch, bevor getAuth() die Umgebung liest. Sonst
  // rendert der Build die App-Seiten vorab und scheitert ohne .env (Docker-Build).
  const requestHeaders = await headers()
  const user = await readSession(await getAuth(), requestHeaders)
  return user === null ? err({ kind: 'unauthenticated' }) : ok(user)
}

function checkAdmin(user: SessionUser): Result<SessionUser, AccessError> {
  return user.role === 'admin' ? ok(user) : err({ kind: 'forbidden' })
}

type HouseholdUser = SessionUser & { householdId: string }

/** Für alles, was Vorrat liest oder schreibt: angemeldet und einem Haushalt zugeordnet. */
export async function requireHouseholdUser(): Promise<Result<HouseholdUser, AccessError>> {
  const result = await requireUser()
  if (!result.ok) return result
  const { householdId } = result.value
  return householdId === null ? err({ kind: 'forbidden' }) : ok({ ...result.value, householdId })
}

export async function requireAdmin(): Promise<Result<SessionUser, AccessError>> {
  const result = await requireUser()
  return result.ok ? checkAdmin(result.value) : result
}

/** Für alles, was ein Admin am Haushalt ändert: Mitglieder, Ziel, Regeln, Nutzer (#37). */
export async function requireHouseholdAdmin(): Promise<Result<HouseholdUser, AccessError>> {
  const result = await requireHouseholdUser()
  if (!result.ok) return result
  return result.value.role === 'admin' ? result : err({ kind: 'forbidden' })
}
