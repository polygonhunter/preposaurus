// Einstieg der Seite Übersicht: echte Repositories, Stichtag in Berlin. Der Use-Case selbst bekommt
// seine Ports übergeben und ist so ohne Datenbank testbar (get-overview.test.ts).
import 'server-only'
import { stockServices } from '@/features/inventory/application/stock-services'
import { loadOpenRestockCount } from '@/features/restock/application/restock-services'
import { getDb } from '@/server/db/get-db'
import type { Overview } from '../schemas'
import { createHouseholdFactsRepository } from '../data/household-facts-repository'
import { getOverview } from './get-overview'

export async function loadOverview(householdId: string): Promise<Overview> {
  const [{ reader, today }, db] = await Promise.all([stockServices(), getDb()])
  const ports = {
    stock: reader,
    facts: createHouseholdFactsRepository(db),
    countOpenRestockItems: loadOpenRestockCount,
  }
  return getOverview(ports, { householdId, today })
}
