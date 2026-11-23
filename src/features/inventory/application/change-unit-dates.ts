// „Datum ändern“ bzw. „Datum nachtragen“ (#49, #116, VOR-05): neues MHD für eine oder mehrere
// Packungen im Vorrat. Ein Datum kommt hier nur aus einer Eingabe, nie aus einer Schätzung: Es ist
// also nie als geschätzt markiert. Ändert sich der Tag, gilt „Noch gut“ nicht mehr (#135).
import 'server-only'
import { changeBestBefore } from '../domain/change-best-before'
import type { BestBeforePrecision } from '../domain/unit'
import { normalizeToPrecision, type CalendarDay } from '@/shared/lib/dates'
import { err, ok, type Result } from '@/shared/lib/result'
import type { NotFound } from './read-context'
import type { UnitDateEditor } from './unit-date-editor'

interface ChangeUnitDatesInput {
  householdId: string
  unitIds: readonly string[]
  bestBefore: { date: CalendarDay; precision: BestBeforePrecision }
}

export async function changeUnitDates(
  editor: Pick<UnitDateEditor, 'loadStockUnits' | 'saveDates'>,
  { householdId, unitIds, bestBefore }: ChangeUnitDatesInput,
): Promise<Result<{ changed: number }, NotFound>> {
  const units = await editor.loadStockUnits(householdId, unitIds)
  if (units.length === 0) return err({ kind: 'not-found' })
  const next = {
    date: normalizeToPrecision(bestBefore.date, bestBefore.precision),
    precision: bestBefore.precision,
    isEstimated: false,
  }
  const changed = await editor.saveDates(
    householdId,
    units.map((unit) => changeBestBefore(unit, next)),
  )
  return changed === 0 ? err({ kind: 'not-found' }) : ok({ changed })
}
