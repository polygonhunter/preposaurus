// Verdrahtung des Ziels für Seiten und Actions: Repository auf der Verbindung des Serverprozesses und
// der heutige Tag in Berlin.
import 'server-only'
import { getDb } from '@/server/db/get-db'
import { todayInBerlin, type CalendarDay } from '@/shared/lib/dates'
import { createGoalRepository, type GoalRepository } from '../data/goal-repository'

export type GoalServices = Readonly<{ goals: GoalRepository; today: CalendarDay }>

export async function goalServices(): Promise<GoalServices> {
  return { goals: createGoalRepository(await getDb()), today: todayInBerlin(new Date()) }
}
