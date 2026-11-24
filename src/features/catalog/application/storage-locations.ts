// Lagerorte verwalten (EIN-04, #77): lesen dürfen alle im Haushalt, ändern nur der Admin (die
// Actions prüfen das). Der Haushalt kommt aus der Sitzung, nie aus der Eingabe.
import 'server-only'
import { err, ok, type Result } from '@/shared/lib/result'
import { findNameConflict } from '../domain/catalog-name'
import { moveInOrder, type MoveDirection } from '../domain/sort-order'
import type { StorageLocation } from '../domain/storage-location'
import type { CatalogServices } from './catalog-services'

type Deps = Pick<CatalogServices, 'storageLocations'>

type Target = Readonly<{ householdId: string; id: string }>

export interface NameError {
  kind: 'duplicate'
  isHidden: boolean
}

export type RenameError = NameError | { kind: 'not-found' }

export type RemoveError = { kind: 'not-found' } | { kind: 'in-use' }

export async function listStorageLocations(
  deps: Deps,
  householdId: string,
): Promise<StorageLocation[]> {
  return deps.storageLocations.list(householdId)
}

export async function findStorageLocation(
  deps: Deps,
  { householdId, id }: Target,
): Promise<StorageLocation | null> {
  const locations = await deps.storageLocations.list(householdId)
  return locations.find((location) => location.id === id) ?? null
}

/** Ort, der schon so heißt (ohne Groß- und Kleinschreibung), auch ausgeblendet */
export async function findStorageLocationByName(
  deps: Deps,
  { householdId, name }: Readonly<{ householdId: string; name: string }>,
): Promise<StorageLocation | null> {
  return findNameConflict(await deps.storageLocations.list(householdId), name, null)
}

export async function addStorageLocation(
  deps: Deps,
  { householdId, name }: Readonly<{ householdId: string; name: string }>,
): Promise<Result<{ id: string }, NameError>> {
  const conflict = await findStorageLocationByName(deps, { householdId, name })
  if (conflict !== null) return err({ kind: 'duplicate', isHidden: conflict.isHidden })
  const id = await deps.storageLocations.create(householdId, name)
  // Gleichzeitig unter demselben Namen angelegt: Die DB hat den zweiten abgelehnt.
  return id === null ? err({ kind: 'duplicate', isHidden: false }) : ok({ id })
}

export async function renameStorageLocation(
  deps: Deps,
  { householdId, id, name }: Target & Readonly<{ name: string }>,
): Promise<Result<null, RenameError>> {
  const conflict = findNameConflict(await deps.storageLocations.list(householdId), name, id)
  if (conflict !== null) return err({ kind: 'duplicate', isHidden: conflict.isHidden })
  const isRenamed = await deps.storageLocations.rename(householdId, id, name)
  return isRenamed ? ok(null) : err({ kind: 'not-found' })
}

export async function setStorageLocationHidden(
  deps: Deps,
  { householdId, id, isHidden }: Target & Readonly<{ isHidden: boolean }>,
): Promise<Result<null, { kind: 'not-found' }>> {
  const isChanged = await deps.storageLocations.setHidden(householdId, id, isHidden)
  return isChanged ? ok(null) : err({ kind: 'not-found' })
}

/** Löscht nur einen Ort, an dem kein Produkt liegt. Sonst bleibt nur das Ausblenden. */
export async function removeStorageLocation(
  deps: Deps,
  { householdId, id }: Target,
): Promise<Result<null, RemoveError>> {
  const outcome = await deps.storageLocations.remove(householdId, id)
  return outcome === 'removed' ? ok(null) : err({ kind: outcome })
}

/** Rückt einen Ort innerhalb seiner Liste (sichtbar oder ausgeblendet) eine Stelle weiter. */
export async function moveStorageLocation(
  deps: Deps,
  { householdId, id, direction }: Target & Readonly<{ direction: MoveDirection }>,
): Promise<void> {
  const locations = await deps.storageLocations.list(householdId)
  const moved = locations.find((location) => location.id === id)
  if (moved === undefined) return
  const sameList = locations.filter((location) => location.isHidden === moved.isHidden)
  const order = moveInOrder(
    sameList.map((location) => location.id),
    id,
    direction,
  )
  if (order !== null) await deps.storageLocations.saveOrder(householdId, order)
}
