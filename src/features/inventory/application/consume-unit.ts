// Use-Case „Verbraucht“ für eine bestimmte Packung (#46, #125): aus dem Blatt einer Datumszeile,
// aus „1 entnehmen“ im Detail und aus „Bald fällig“. Rückgängig statt Rückfrage (UX-Konzept P7).
import 'server-only'
import { err, ok, type Result } from '@/shared/lib/result'
import type { NotFound } from './read-context'
import type { UnitWriter } from './unit-writer'

export type ConsumeError = NotFound | { kind: 'not-in-stock' }

interface ConsumeInput {
  householdId: string
  userId: string | null
  unitId: string
  now: Date
}

export async function consumeUnit(
  writer: UnitWriter,
  { householdId, userId, unitId, now }: ConsumeInput,
): Promise<Result<{ unitId: string }, ConsumeError>> {
  const outcome = await writer.takeOut(householdId, {
    unitId,
    status: 'consumed',
    userId,
    at: now,
  })
  if (outcome === 'updated') return ok({ unitId })
  return err({ kind: outcome })
}
