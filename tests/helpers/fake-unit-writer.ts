// Fake des Schreib-Ports `UnitWriter` für die Use-Case-Tests (ohne DB). Er ändert dieselben
// Einheiten, die der Fake-Leser liefert, und prüft wie das echte Repository Haushalt und Status.
import type { StockProductUnit } from '@/features/inventory/domain/stock-entry'
import type { CalendarDay } from '@/shared/lib/dates'

interface FakeWriterData {
  householdId: string
  units: StockProductUnit[]
}

export interface TakeOutCall {
  householdId: string
  unitId: string
  status: 'consumed' | 'discarded'
  userId: string
  at: Date
}

type StillGoodChange = Readonly<{ unitIds: readonly string[]; checkedAt: CalendarDay }>

// Wie die Bedingung im Repository: im Vorrat, MHD (kein Verbrauchsdatum), abgelaufen, ungeprüft
const canMarkStillGood = (unit: StockProductUnit, today: CalendarDay) =>
  unit.status === 'stock' &&
  unit.kind === 'best-before' &&
  unit.checkedAt === null &&
  unit.bestBefore !== null &&
  unit.bestBefore.date < today

export function createFakeUnitWriter(data: FakeWriterData) {
  const calls: TakeOutCall[] = []
  // Wer welche Packung entnommen hat, für „Rückgängig nur die eigene Entnahme“
  const takenBy = new Map<string, string>()
  const find = (householdId: string, unitId: string) =>
    householdId === data.householdId ? data.units.find((unit) => unit.id === unitId) : undefined
  const findAll = (householdId: string, unitIds: readonly string[]) =>
    unitIds.map((unitId) => find(householdId, unitId)).filter((unit) => unit !== undefined)
  return {
    calls,
    takeOut: (householdId: string, change: Omit<TakeOutCall, 'householdId'>) => {
      calls.push({ householdId, ...change })
      const unit = find(householdId, change.unitId)
      if (unit === undefined) return Promise.resolve('not-found' as const)
      if (unit.status !== 'stock') return Promise.resolve('not-in-stock' as const)
      unit.status = change.status
      takenBy.set(unit.id, change.userId)
      return Promise.resolve('updated' as const)
    },
    returnToStock: (
      householdId: string,
      { unitId, userId }: { unitId: string; userId: string },
    ) => {
      const unit = find(householdId, unitId)
      if (unit?.status === 'stock') return Promise.resolve('already-in-stock' as const)
      if (unit === undefined || takenBy.get(unitId) !== userId) {
        return Promise.resolve('not-found' as const)
      }
      unit.status = 'stock'
      takenBy.delete(unitId)
      return Promise.resolve('updated' as const)
    },
    markStillGood: (householdId: string, { unitIds, checkedAt }: StillGoodChange) => {
      const marked = findAll(householdId, unitIds).filter((unit) =>
        canMarkStillGood(unit, checkedAt),
      )
      for (const unit of marked) unit.checkedAt = checkedAt
      return Promise.resolve(marked.map((unit) => unit.id))
    },
    undoStillGood: (householdId: string, { unitIds, checkedAt }: StillGoodChange) => {
      for (const unit of findAll(householdId, unitIds)) {
        if (unit.status === 'stock' && unit.checkedAt === checkedAt) unit.checkedAt = null
      }
      return Promise.resolve()
    },
    countOwnUnits: (householdId: string, unitIds: readonly string[]) =>
      Promise.resolve(findAll(householdId, unitIds).length),
  }
}
