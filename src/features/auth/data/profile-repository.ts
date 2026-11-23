// Mein Konto (#75, #89): eigener Anzeigename, freiwillige Adresse für Erinnerungen, Stand des
// Passworts und die Check-in-Mail. Jede Abfrage gilt nur dem angemeldeten Nutzer, Hashes und
// Sitzungs-Token liest hier nichts. Das Passwort selbst ändert Better Auth (server/auth).
import 'server-only'
import { and, eq, ne } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import type { Database } from '@/server/db/connection'
import { sessions, users } from '@/server/db/schema/account'
import { households } from '@/server/db/schema/household'
import { notificationSettings } from '@/server/db/schema/reminders'
import type { CHECK_IN_CADENCES } from '@/shared/config/constants'
import type { OwnProfile } from '../domain/profile'

type CheckInCadence = (typeof CHECK_IN_CADENCES)[number]

const changer = alias(users, 'geaendert_von')

async function readCheckIn(db: Database, userId: string): Promise<string | null> {
  const [row] = await db
    .select({ isEnabled: notificationSettings.isEnabled, schedule: notificationSettings.schedule })
    .from(notificationSettings)
    .where(
      and(eq(notificationSettings.userId, userId), eq(notificationSettings.kind, 'checkin_mail')),
    )
  return row?.isEnabled === true ? row.schedule : null
}

export async function readOwnProfile(db: Database, userId: string): Promise<OwnProfile | null> {
  const [row] = await db
    .select({
      displayName: users.name,
      username: users.username,
      reminderEmail: users.reminderEmail,
      householdName: households.name,
      isPasswordTemporary: users.isPasswordTemporary,
      passwordChangedAt: users.passwordChangedAt,
      passwordChangedByName: changer.name,
    })
    .from(users)
    .leftJoin(households, eq(households.id, users.householdId))
    .leftJoin(changer, eq(changer.id, users.passwordChangedBy))
    .where(eq(users.id, userId))
  if (row === undefined) return null
  return { ...row, checkInCadence: await readCheckIn(db, userId) }
}

export async function saveOwnProfile(
  db: Database,
  userId: string,
  change: Readonly<{ displayName: string; reminderEmail: string | null }>,
): Promise<void> {
  await db
    .update(users)
    .set({ name: change.displayName, reminderEmail: change.reminderEmail })
    .where(eq(users.id, userId))
}

/** Nach dem eigenen Ändern: nicht mehr vorläufig, geändert jetzt von sich selbst */
export async function markPasswordChangedBySelf(
  db: Database,
  userId: string,
  now: Date,
): Promise<void> {
  await db
    .update(users)
    .set({ isPasswordTemporary: false, passwordChangedAt: now, passwordChangedBy: userId })
    .where(eq(users.id, userId))
}

/** Beendet alle Sitzungen des Nutzers außer der genannten (dieses Gerät bleibt angemeldet) */
export async function endOtherSessions(
  db: Database,
  userId: string,
  keepSessionId: string | null,
): Promise<void> {
  const ofUser = eq(sessions.userId, userId)
  await db
    .delete(sessions)
    .where(keepSessionId === null ? ofUser : and(ofUser, ne(sessions.id, keepSessionId)))
}

export async function saveCheckIn(
  db: Database,
  userId: string,
  cadence: CheckInCadence | null,
): Promise<void> {
  const values = { isEnabled: cadence !== null, schedule: cadence }
  await db
    .insert(notificationSettings)
    .values({ userId, kind: 'checkin_mail', ...values })
    .onConflictDoUpdate({
      target: [notificationSettings.userId, notificationSettings.kind],
      set: values,
    })
}
