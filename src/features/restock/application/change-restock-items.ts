// Use-Cases für Einträge der Liste (#73, NK-03, NK-04, #202): ergänzen, abhaken, entfernen und
// „Rückgängig“ nach dem Entfernen. Die Eingaben sind schon geprüft (Action mit Zod), der Haushalt
// kommt aus der Sitzung.
import 'server-only'
import { err, ok, type Result } from '@/shared/lib/result'
import type { RestockItemDone } from '../schemas'
import type { RestockRepository, StoredRestockItem } from './restock-repository'

type NotFound = Readonly<{ kind: 'not-found' }>

interface HouseholdInput {
  householdId: string
}

export async function addRestockItem(
  repository: Pick<RestockRepository, 'addItem'>,
  { householdId, label }: HouseholdInput & { label: string },
): Promise<void> {
  await repository.addItem(householdId, { label, source: 'manuell', productId: null })
}

export async function setRestockItemDone(
  repository: Pick<RestockRepository, 'setDone'>,
  { householdId, ...change }: HouseholdInput & RestockItemDone,
): Promise<Result<void, NotFound>> {
  const found = await repository.setDone(householdId, change)
  return found ? ok(undefined) : err({ kind: 'not-found' })
}

/** Entfernt den Eintrag und gibt ihn zurück, damit „Rückgängig“ ihn wieder anlegen kann. */
export async function removeRestockItem(
  repository: Pick<RestockRepository, 'removeItem'>,
  { householdId, id }: HouseholdInput & { id: string },
): Promise<Result<StoredRestockItem, NotFound>> {
  const removed = await repository.removeItem(householdId, id)
  return removed === null ? err({ kind: 'not-found' }) : ok(removed)
}

/**
 * Legt einen eben entfernten Eintrag wieder an. Eine Lücke (quelle „ziel“) kommt so nie zurück:
 * Ihr Eintrag entsteht nur über Abhaken oder Ausblenden mit der Fehlmenge dieses Moments (#201).
 */
export async function restoreRestockItem(
  repository: Pick<RestockRepository, 'restoreItem'>,
  { householdId, item }: HouseholdInput & { item: StoredRestockItem },
): Promise<void> {
  if (item.source === 'ziel') return
  await repository.restoreItem(householdId, item)
}
