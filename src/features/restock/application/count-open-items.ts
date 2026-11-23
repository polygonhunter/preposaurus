// Zahl offener, gespeicherter Einträge der Nachkaufen-Liste für die Wochenübersicht (#186). Die
// Lücken bis zum Ziel zählen dort nicht mit, dafür hat die Wochenübersicht die eigene Zeile „Ziel“.
import 'server-only'
import type { RestockRepository } from './restock-repository'

export async function countOpenRestockItems(
  repository: Pick<RestockRepository, 'listItems'>,
  householdId: string,
): Promise<number> {
  const items = await repository.listItems(householdId)
  return items.filter((item) => !item.isDone).length
}
