// Use-Cases für eigene Einträge (#73, NK-03, NK-04): ergänzen, abhaken und entfernen. Die Eingaben
// sind schon geprüft (Action mit Zod), der Haushalt kommt aus der Sitzung.
import 'server-only'
import { err, ok, type Result } from '@/shared/lib/result'
import type { RestockItemDone } from '../schemas'
import type { RestockRepository } from './restock-repository'

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

export async function removeRestockItem(
  repository: Pick<RestockRepository, 'removeItem'>,
  { householdId, id }: HouseholdInput & { id: string },
): Promise<Result<void, NotFound>> {
  const found = await repository.removeItem(householdId, id)
  return found ? ok(undefined) : err({ kind: 'not-found' })
}
