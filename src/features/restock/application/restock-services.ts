// Verdrahtung für Seite und Actions der Nachkaufen-Liste: echtes Repository auf der Verbindung des
// Serverprozesses, die Ziel-Lücke aus supply und der Stichtag in Berlin.
import 'server-only'
import { loadGoalGaps } from '@/features/supply/application/goal-loaders'
import { getDb } from '@/server/db/get-db'
import { todayInBerlin } from '@/shared/lib/dates'
import { createRestockRepository } from '../data/restock-repository'
import { countOpenRestockItems } from './count-open-items'
import { getRestockList } from './get-restock-list'
import type { RestockRepository } from './restock-repository'

export async function restockRepository(): Promise<RestockRepository> {
  return createRestockRepository(await getDb())
}

/** Einstieg der Seite Nachkaufen: Liste des Haushalts am heutigen Tag in Berlin. */
export async function loadRestockList(householdId: string) {
  const repository = await restockRepository()
  const today = todayInBerlin(new Date())
  return getRestockList({ repository, loadGoalGaps }, { householdId, today })
}

/** Offene Einträge für die Wochenübersicht der Erinnerungen (#186). */
export async function loadOpenRestockCount(householdId: string): Promise<number> {
  return countOpenRestockItems(await restockRepository(), householdId)
}
