'use server'
// Speichern einer Erfassung (#51, T#api-intern `createStockAction`), gleich für Foto und manuell.
// Dünne Hülle: Sitzung und Haushalt prüfen, Eingabe mit Zod prüfen, Use-Case aufrufen und das
// Ergebnis in einen ruhigen deutschen Text übersetzen. Der Haushalt kommt aus der Sitzung, nie
// aus der Eingabe.
import { z } from 'zod'
import { requireHouseholdUser, type AccessError } from '@/server/auth/guards'
import type { CreateStockError } from '../application/create-stock'
import { createStockForUser } from '../application/stock-request'
import { createStockSchema } from '../schemas/stock'

export type CreateStockState =
  | {
      status: 'saved'
      captureId: string
      productId: string
      unitCount: number
      /** true: Dieselbe Erfassung war schon gespeichert (doppeltes Tippen), nichts kam dazu */
      isReplay: boolean
    }
  | { status: 'error'; message: string; fieldErrors: Readonly<Record<string, string[]>> }

const failure = (
  message: string,
  fieldErrors: Record<string, string[]> = {},
): CreateStockState => ({
  status: 'error',
  message,
  fieldErrors,
})

function accessMessage(error: AccessError): string {
  switch (error.kind) {
    case 'unauthenticated':
      return 'Bitte melde dich erneut an.'
    case 'forbidden':
      return 'Dein Konto gehört noch zu keinem Haushalt.'
  }
}

const REFERENCE_MESSAGES = {
  'food-type': 'Diese Lebensmittelart gibt es nicht mehr. Bitte wählt sie neu aus.',
  'storage-location': 'Diesen Lagerort gibt es nicht mehr. Bitte wählt ihn neu aus.',
  container: 'Diesen Behälter gibt es nicht mehr. Bitte wählt ihn neu aus.',
  product: 'Dieses Produkt gibt es nicht mehr. Bitte lege es neu an.',
} as const

function errorMessage(error: CreateStockError): string {
  switch (error.kind) {
    case 'invalid':
      return 'Eine Schätzung gibt es nur als Monat oder Jahr, nicht als genauen Tag.'
    case 'not-found':
      return REFERENCE_MESSAGES[error.reference]
    case 'conflict':
      return 'Das Speichern hat nicht geklappt. Bitte starte die Erfassung neu.'
  }
}

export async function createStockAction(input: unknown): Promise<CreateStockState> {
  const user = await requireHouseholdUser()
  if (!user.ok) return failure(accessMessage(user.error))
  const parsed = createStockSchema.safeParse(input)
  if (!parsed.success) {
    return failure('Bitte prüft die Angaben.', z.flattenError(parsed.error).fieldErrors)
  }
  const result = await createStockForUser(
    { householdId: user.value.householdId, userId: user.value.id },
    parsed.data,
  )
  if (!result.ok) return failure(errorMessage(result.error))
  return { status: 'saved', ...result.value }
}
