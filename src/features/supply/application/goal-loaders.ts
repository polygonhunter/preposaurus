// Einstiege für Ziel-Lücke (Nachkaufen-Liste, #72) und Stand des Ziels (Wochenübersicht, #186) mit
// echten Repositories. Die Use-Cases selbst bekommen ihre Ports übergeben und sind ohne DB testbar.
import 'server-only'
import { stockServices } from '@/features/inventory/application/stock-services'
import { getDb } from '@/server/db/get-db'
import { createHouseholdFactsRepository } from '../data/household-facts-repository'
import { getGoalGaps, type GoalGapPorts, type GoalGaps } from './get-goal-gaps'
import { getGoalStatus, type GoalStatus } from './get-goal-status'
import type { HouseholdDay } from './stock-snapshot'

async function goalPorts(): Promise<GoalGapPorts> {
  const [{ reader }, db] = await Promise.all([stockServices(), getDb()])
  return { stock: reader, facts: createHouseholdFactsRepository(db) }
}

export async function loadGoalGaps(input: HouseholdDay): Promise<GoalGaps> {
  return getGoalGaps(await goalPorts(), input)
}

export async function loadGoalStatus(input: HouseholdDay): Promise<GoalStatus | null> {
  return getGoalStatus(await goalPorts(), input)
}
