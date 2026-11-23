// Verdrahtung für Seiten und Actions: echte Repositories auf der Verbindung des Serverprozesses und
// der heutige Tag in Berlin. Die Use-Cases bekommen ihre Ports übergeben und bleiben ohne DB testbar.
import 'server-only'
import { getDb } from '@/server/db/get-db'
import { todayInBerlin, type CalendarDay } from '@/shared/lib/dates'
import {
  createHouseholdSettingsRepository,
  type HouseholdSettingsRepository,
} from '../data/household-settings-repository'
import { createMemberRepository, type MemberRepository } from '../data/member-repository'

export type HouseholdServices = Readonly<{
  members: MemberRepository
  settings: HouseholdSettingsRepository
  today: CalendarDay
}>

export async function householdServices(): Promise<HouseholdServices> {
  const db = await getDb()
  return {
    members: createMemberRepository(db),
    settings: createHouseholdSettingsRepository(db),
    today: todayInBerlin(new Date()),
  }
}
