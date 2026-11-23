// Haushalt der Anfrage für die Seiten (#44, #45, #125, #37). Ohne gültige Sitzung oder ohne Haushalt
// geht es zur Anmeldung. Admin-Seiten gibt es für Mitglieder nicht, auch nicht per Direktaufruf:
// Sie antworten mit „nicht gefunden“. Actions nutzen die Guards aus guards.ts selbst.
import 'server-only'
import { notFound, redirect } from 'next/navigation'
import { requireHouseholdUser } from './guards'

const SIGN_IN_PATH = '/anmelden'

type HouseholdAccess = Readonly<{
  householdId: string
  userId: string
  username: string
  isAdmin: boolean
}>

export async function requirePageHousehold(): Promise<HouseholdAccess> {
  const user = await requireHouseholdUser()
  if (!user.ok) redirect(SIGN_IN_PATH)
  const { householdId, id, username, role } = user.value
  return { householdId, userId: id, username, isAdmin: role === 'admin' }
}

export async function requirePageHouseholdAdmin(): Promise<HouseholdAccess> {
  const access = await requirePageHousehold()
  if (!access.isAdmin) notFound()
  return access
}
