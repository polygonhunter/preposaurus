// Verdrahtung für den Worker: echte Repositories auf der Verbindung des Prozesses. Die Use-Cases
// bekommen ihre Ports weiter übergeben, damit Tests sie durch Fakes ersetzen können.
import 'server-only'
import { stockServices } from '@/features/inventory/application/stock-services'
import { loadOpenRestockCount } from '@/features/restock/application/restock-services'
import { loadGoalStatus } from '@/features/supply/application/goal-loaders'
import { getDb } from '@/server/db/get-db'
import { createReminderRepository } from '../data/reminder-repository'
import type { ReminderRepository } from './reminder-repository'
import type { ReminderGoalFacts, ReminderStockDeps } from './reminder-stock'

interface ReminderStores extends ReminderStockDeps {
  repository: ReminderRepository
  goals: ReminderGoalFacts
}

export async function reminderStores(): Promise<ReminderStores> {
  const [db, { reader }] = await Promise.all([getDb(), stockServices()])
  return {
    reader,
    repository: createReminderRepository(db),
    goals: { loadGoalStatus, countOpenRestockItems: loadOpenRestockCount },
  }
}
