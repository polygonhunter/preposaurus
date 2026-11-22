// Haushalt der Anfrage für die Seiten des Vorrats (#44, #45, #125). Ohne gültige Sitzung oder ohne
// Haushalt geht es zur Anmeldung. Actions nutzen `requireHouseholdUser` direkt.
import 'server-only'
import { redirect } from 'next/navigation'
import { requireHouseholdUser } from './guards'

const SIGN_IN_PATH = '/anmelden'

type HouseholdAccess = Readonly<{ householdId: string; userId: string }>

export async function requirePageHousehold(): Promise<HouseholdAccess> {
  const user = await requireHouseholdUser()
  if (!user.ok) redirect(SIGN_IN_PATH)
  return { householdId: user.value.householdId, userId: user.value.id }
}
