// Use-Case „Verbraucht“ bzw. „Entsorgt“ für eine bestimmte Packung (#46, #47, #125): aus dem Blatt
// einer Datumszeile, aus „1 entnehmen“ im Detail und aus „Bald fällig“. Rückgängig statt Rückfrage
// (UX-Konzept P7). Beide Ausgänge setzen Status, Zeitpunkt und Nutzer (DATENKATALOG §5).
import 'server-only'
import { err, ok, type Result } from '@/shared/lib/result'
import type { NotFound } from './read-context'
import type { TakeOutcome, UnitWriter } from './unit-writer'

export type TakeOutError = NotFound | { kind: 'not-in-stock' }

interface TakeOutInput {
  householdId: string
  userId: string
  unitId: string
  outcome: TakeOutcome
  now: Date
}

export async function takeOutUnit(
  writer: UnitWriter,
  { householdId, userId, unitId, outcome, now }: TakeOutInput,
): Promise<Result<{ unitId: string }, TakeOutError>> {
  const result = await writer.takeOut(householdId, { unitId, status: outcome, userId, at: now })
  if (result === 'updated') return ok({ unitId })
  return err({ kind: result })
}
