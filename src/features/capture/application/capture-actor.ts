// Wer erfasst: Nutzer samt Haushalt aus der Sitzung, je Aufruf frisch aus der DB geprüft
// (`requireHouseholdUser`). Routen und Actions der Erfassung rufen das als Erstes auf.
import 'server-only'
import { requireHouseholdUser, type AccessError } from '@/server/auth/guards'
import { ok, type Result } from '@/shared/lib/result'

export interface CaptureActor {
  householdId: string
  userId: string
}

export type CaptureAccessError = AccessError

export async function requireCaptureActor(): Promise<Result<CaptureActor, CaptureAccessError>> {
  const user = await requireHouseholdUser()
  if (!user.ok) return user
  return ok({ householdId: user.value.householdId, userId: user.value.id })
}
