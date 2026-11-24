// Neuer Lagerort direkt aus der Erfassung (#301): Admin und Mitglied, immer im Haushalt der Sitzung.
// Angelegt wird über denselben Use-Case wie in den Einstellungen (Dubletten ohne Groß- und
// Kleinschreibung, neuer Ort am Ende der Liste). Heißt ein sichtbarer Ort schon so, kommt er zurück
// und wird gewählt, statt eine Dublette anzulegen. Das Recht prüft die Action.
import 'server-only'
import {
  catalogServices,
  type CatalogServices,
} from '@/features/catalog/application/catalog-services'
import {
  addStorageLocation,
  findStorageLocationByName,
} from '@/features/catalog/application/storage-locations'
import { err, ok, type Result } from '@/shared/lib/result'
import type { NamedChoice } from '../domain/capture-options'

type Deps = Pick<CatalogServices, 'storageLocations'>

interface AddStorageLocationCommand {
  householdId: string
  name: string
}

export interface AddedStorageLocation {
  location: NamedChoice
  /** Den Ort gab es schon: Das Formular wählt ihn und sagt das dazu */
  isExisting: boolean
}

/** Gleichnamig ausgeblendet (einblenden darf nur der Admin) oder gleichzeitig wieder gelöscht */
export type AddStorageLocationError = { kind: 'hidden' } | { kind: 'not-found' }

async function addStorageLocationFromCapture(
  deps: Deps,
  { householdId, name }: AddStorageLocationCommand,
): Promise<Result<AddedStorageLocation, AddStorageLocationError>> {
  const added = await addStorageLocation(deps, { householdId, name })
  if (added.ok) return ok({ location: { id: added.value.id, name }, isExisting: false })
  const existing = await findStorageLocationByName(deps, { householdId, name })
  if (existing === null) return err({ kind: 'not-found' })
  if (existing.isHidden) return err({ kind: 'hidden' })
  return ok({ location: { id: existing.id, name: existing.name }, isExisting: true })
}

export async function addStorageLocationForHousehold(command: AddStorageLocationCommand) {
  return addStorageLocationFromCapture(await catalogServices(), command)
}
