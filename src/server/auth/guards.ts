// Helfer für jede Server Action und Route (EINSTELLUNGEN_NUTZER §5): Sitzung und Rolle werden je
// Aufruf aus der DB geprüft, auch bei Direktaufruf. Erwartete Fehler sind Rückgabewerte.
import 'server-only'
import { headers } from 'next/headers'
import { err, ok, type Result } from '@/shared/lib/result'
import { getAuth } from './get-auth'
import { readSession, type SessionUser } from './session'

export type AccessError = { kind: 'unauthenticated' } | { kind: 'forbidden' }

export async function requireUser(): Promise<Result<SessionUser, AccessError>> {
  const user = await readSession(await getAuth(), await headers())
  return user === null ? err({ kind: 'unauthenticated' }) : ok(user)
}

function checkAdmin(user: SessionUser): Result<SessionUser, AccessError> {
  return user.role === 'admin' ? ok(user) : err({ kind: 'forbidden' })
}

export async function requireAdmin(): Promise<Result<SessionUser, AccessError>> {
  const result = await requireUser()
  return result.ok ? checkAdmin(result.value) : result
}
