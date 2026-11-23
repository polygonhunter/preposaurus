// Use-Case „Noch gut“ (#47, ROT-05, UX-Konzept §8.2): Jemand hat abgelaufene Packungen angeschaut
// und für gut befunden. `geprueft_am` wird der Stichtag, die Packungen bleiben im Vorrat und
// verlassen die Gruppe „Abgelaufen“. Beim Verbrauchsdatum gibt es das nicht (ROT-06). Ob sie
// danach zu „Heute versorgt“ zählen, entscheidet allein der Haushalts-Schalter (#117).
import 'server-only'
import type { CalendarDay } from '@/shared/lib/dates'
import { err, ok, type Result } from '@/shared/lib/result'
import type { NotFound } from './read-context'
import type { UnitWriter } from './unit-writer'

/** Schon geprüft, nicht abgelaufen, Verbrauchsdatum oder nicht mehr im Vorrat */
export type StillGoodError = NotFound | { kind: 'not-applicable' }

export interface StillGoodMarked {
  unitIds: string[]
  checkedAt: CalendarDay
}

interface StillGoodInput {
  householdId: string
  unitIds: readonly string[]
  today: CalendarDay
}

export async function markStillGood(
  writer: UnitWriter,
  { householdId, unitIds, today }: StillGoodInput,
): Promise<Result<StillGoodMarked, StillGoodError>> {
  const marked = await writer.markStillGood(householdId, { unitIds, checkedAt: today })
  if (marked.length > 0) return ok({ unitIds: marked, checkedAt: today })
  const known = await writer.countOwnUnits(householdId, unitIds)
  return err({ kind: known === 0 ? 'not-found' : 'not-applicable' })
}

/**
 * Rückgängig nach „Noch gut“: nur für die eben geprüften Packungen und nur, solange dort noch
 * derselbe Tag steht. Wer geprüft hat, speichert die Datenbank nicht (keine Spalte dafür).
 */
export async function undoStillGood(
  writer: UnitWriter,
  { householdId, unitIds, checkedAt }: Readonly<{ householdId: string } & StillGoodMarked>,
): Promise<void> {
  await writer.undoStillGood(householdId, { unitIds, checkedAt })
}
