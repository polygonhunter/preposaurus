// Wer erfasst: Nutzer samt Haushalt aus der Sitzung, je Aufruf frisch aus der DB geprüft.
// Ohne Haushalt gibt es nichts zu erfassen. Routen und Actions rufen das als Erstes auf.
import 'server-only'
import { requireUser, type AccessError } from '@/server/auth/guards'
import { err, ok, type Result } from '@/shared/lib/result'

export interface CaptureActor {
  householdId: string
  userId: string
}

export type CaptureAccessError = AccessError | { kind: 'no-household' }

export async function requireCaptureActor(): Promise<Result<CaptureActor, CaptureAccessError>> {
  const user = await requireUser()
  if (!user.ok) return user
  const { id: userId, householdId } = user.value
  return householdId === null ? err({ kind: 'no-household' }) : ok({ householdId, userId })
}
