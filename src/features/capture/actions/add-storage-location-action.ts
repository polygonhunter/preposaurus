'use server'
// Neuer Lagerort aus der Erfassung (#301): Admin und Mitglied des Haushalts (#298, Option a). Den
// Namen prüft dasselbe Schema wie in den Einstellungen. Die Antwort trägt den Ort, damit das
// Formular ihn ohne Neuladen wählen kann, auch wenn es ihn unter diesem Namen schon gab.
import { z } from 'zod'
import { catalogNameSchema } from '@/features/catalog/schemas'
import { requireHouseholdUser } from '@/server/auth/guards'
import {
  addStorageLocationForHousehold,
  type AddedStorageLocation,
  type AddStorageLocationError,
} from '../application/add-storage-location'
import { accessMessage } from './action-messages'

export type AddStorageLocationOutcome =
  | ({ ok: true } & AddedStorageLocation)
  | { ok: false; nameError: string | null; message: string | null }

const inputSchema = z.object({ name: catalogNameSchema })

const HIDDEN =
  'Diesen Lagerort gibt es schon, er ist ausgeblendet. Ein Admin kann ihn in den Einstellungen wieder einblenden.'

const GONE = 'Das hat nicht geklappt. Bitte ladet die Seite neu.'

const failure = (
  problem: Partial<Omit<Extract<AddStorageLocationOutcome, { ok: false }>, 'ok'>>,
): AddStorageLocationOutcome => ({ ok: false, nameError: null, message: null, ...problem })

function problemOf(error: AddStorageLocationError): AddStorageLocationOutcome {
  switch (error.kind) {
    case 'hidden':
      return failure({ nameError: HIDDEN })
    case 'not-found':
      return failure({ message: GONE })
  }
}

export async function addStorageLocationFromCaptureAction(input: {
  name: string
}): Promise<AddStorageLocationOutcome> {
  const user = await requireHouseholdUser()
  if (!user.ok) return failure({ message: accessMessage(user.error) })
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) {
    const [message] = z.flattenError(parsed.error).fieldErrors.name ?? []
    return failure({ nameError: message ?? 'Bitte einen Namen eintragen.' })
  }
  const result = await addStorageLocationForHousehold({
    householdId: user.value.householdId,
    name: parsed.data.name,
  })
  return result.ok ? { ok: true, ...result.value } : problemOf(result.error)
}
