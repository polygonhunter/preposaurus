// Verdrahtung für den Worker: echte Repositories auf der Verbindung des Prozesses. Die Use-Cases
// bekommen ihre Ports weiter übergeben, damit Tests sie durch Fakes ersetzen können.
import 'server-only'
import { stockServices } from '@/features/inventory/application/stock-services'
import { getDb } from '@/server/db/get-db'
import { createReminderRepository } from '../data/reminder-repository'
import type { ReminderRepository } from './reminder-repository'
import type { ReminderStockDeps } from './reminder-stock'

interface ReminderStores extends ReminderStockDeps {
  repository: ReminderRepository
}

export async function reminderStores(): Promise<ReminderStores> {
  const [db, { reader }] = await Promise.all([getDb(), stockServices()])
  return { reader, repository: createReminderRepository(db) }
}
