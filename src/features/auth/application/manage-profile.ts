// Mein Konto (#75, #89): Anzeigename und Adresse für Erinnerungen ändern, Check-in-Mail wählen.
// Das Passwort ändert change-own-password.ts. Jeder Nutzer ändert nur sich selbst, die ID kommt aus
// der Sitzung.
import 'server-only'
import { err, ok, type Result } from '@/shared/lib/result'
import { readOwnProfile, saveCheckIn, saveOwnProfile } from '../data/profile-repository'
import type { ProfileView } from '../domain/profile'
import type { CheckInChoice, ProfileInput } from '../schemas'
import type { ProfileServices } from './profile-services'

export async function getOwnProfile(
  deps: ProfileServices,
  userId: string,
): Promise<ProfileView | null> {
  const profile = await readOwnProfile(deps.db, userId)
  return profile === null ? null : { ...profile, isMailConfigured: deps.isMailConfigured }
}

export async function updateOwnProfile(
  deps: Pick<ProfileServices, 'db'>,
  command: Readonly<{ userId: string; input: ProfileInput }>,
): Promise<void> {
  await saveOwnProfile(deps.db, command.userId, command.input)
}

export interface CheckInError {
  kind: 'mail-unavailable'
}

/** Die Check-in-Mail lässt sich nur mit Mailversand und eigener Adresse einschalten (#89). */
export async function saveOwnCheckIn(
  deps: ProfileServices,
  command: Readonly<{ userId: string; choice: CheckInChoice }>,
): Promise<Result<null, CheckInError>> {
  const cadence = command.choice === 'aus' ? null : command.choice
  if (cadence !== null) {
    const profile = await readOwnProfile(deps.db, command.userId)
    if (!deps.isMailConfigured || (profile?.reminderEmail ?? null) === null) {
      return err({ kind: 'mail-unavailable' })
    }
  }
  await saveCheckIn(deps.db, command.userId, cadence)
  return ok(null)
}
