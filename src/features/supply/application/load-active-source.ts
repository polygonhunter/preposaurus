// Aktive Empfehlungsquelle des Haushalts mit Stand und Link, für Erklär-Blätter außerhalb der
// Übersicht (#230: Kennwerte im Detail). Die Übersicht liest sie in getOverview über ihren Port.
import 'server-only'
import { getDb } from '@/server/db/get-db'
import type { RecommendationSource } from '@/shared/config/recommendation-source'
import { createHouseholdFactsRepository } from '../data/household-facts-repository'

export async function loadActiveSource(householdId: string): Promise<RecommendationSource | null> {
  return createHouseholdFactsRepository(await getDb()).loadActiveSource(householdId)
}
