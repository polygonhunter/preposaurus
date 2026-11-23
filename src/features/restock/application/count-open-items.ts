// Zahl offener, gespeicherter Einträge der Nachkaufen-Liste, die eine Zählung für Übersicht und
// Wochenübersicht (#186, #202). Lücken und Vorschläge zählen dort nicht mit: Die Übersicht nennt die
// Lücken eigens, die Wochenübersicht hat die Zeile „Ziel“.
import 'server-only'
import type { RestockRepository } from './restock-repository'

export async function countOpenRestockItems(
  repository: Pick<RestockRepository, 'countOpenItems'>,
  householdId: string,
): Promise<number> {
  return repository.countOpenItems(householdId)
}
