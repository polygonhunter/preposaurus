// Use-Case „Rückgängig“ nach Verbraucht (#46, UX-Konzept §7): Die Packung kommt zurück in den
// Vorrat, Zeitpunkt und Nutzer der Entnahme werden gelöscht. Schon im Vorrat ist kein Fehler,
// denn dann ist das Ziel erreicht (z. B. doppelt getippt).
import 'server-only'
import { err, ok, type Result } from '@/shared/lib/result'
import type { NotFound } from './read-context'
import type { UnitWriter } from './unit-writer'

interface ReturnInput {
  householdId: string
  unitId: string
}

export async function returnToStock(
  writer: UnitWriter,
  { householdId, unitId }: ReturnInput,
): Promise<Result<{ unitId: string }, NotFound>> {
  const outcome = await writer.returnToStock(householdId, unitId)
  return outcome === 'not-found' ? err({ kind: 'not-found' }) : ok({ unitId })
}
