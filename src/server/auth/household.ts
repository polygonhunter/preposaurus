// Haushalt der Anfrage für Seiten und Actions des Vorrats (#44 bis #46, #125). Alle Lese- und
// Schreibpfade holen haushalt_id und Nutzer nur hier, damit #33 (Anmeldung und Zugriffsschutz)
// genau eine Stelle anpasst.
// Übergang bis #33: Ohne Sitzung gilt im Dev-Modus (oder mit DEV_HOUSEHOLD_WITHOUT_LOGIN=true)
// der älteste Haushalt der Installation, entnommen wird im Namen seines ersten aktiven Admins.
import 'server-only'
import { and, asc, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { isHouseholdWithoutLoginEnabled, loadEnv } from '@/shared/config/env'
import { err, ok, type Result } from '@/shared/lib/result'
import { getDb } from '../db/get-db'
import { users } from '../db/schema/account'
import { households } from '../db/schema/household'
import { requireUser, type AccessError } from './guards'

export type HouseholdAccess = Readonly<{ householdId: string; userId: string | null }>

// Seite „Anmelden“ (UX §8.6), kommt mit #33
const SIGN_IN_PATH = '/anmelden'

async function loadInstallationHousehold(): Promise<HouseholdAccess | null> {
  const db = await getDb()
  const [household] = await db
    .select({ id: households.id })
    .from(households)
    .orderBy(asc(households.createdAt), asc(households.id))
    .limit(1)
  if (household === undefined) return null
  const [admin] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(eq(users.householdId, household.id), eq(users.role, 'admin'), eq(users.isActive, true)),
    )
    .orderBy(asc(users.createdAt), asc(users.id))
    .limit(1)
  return { householdId: household.id, userId: admin?.id ?? null }
}

export async function requireHousehold(): Promise<Result<HouseholdAccess, AccessError>> {
  const session = await requireUser()
  if (session.ok) {
    const { householdId, id } = session.value
    return householdId === null ? err({ kind: 'forbidden' }) : ok({ householdId, userId: id })
  }
  if (!isHouseholdWithoutLoginEnabled(loadEnv())) return session
  const fallback = await loadInstallationHousehold()
  return fallback === null ? session : ok(fallback)
}

/** Für Seiten: ohne Zugriff weiter zur Anmeldung. */
export async function requirePageHousehold(): Promise<HouseholdAccess> {
  const access = await requireHousehold()
  if (!access.ok) redirect(SIGN_IN_PATH)
  return access.value
}
