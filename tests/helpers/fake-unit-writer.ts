// Fake des Schreib-Ports `UnitWriter` für die Use-Case-Tests (ohne DB). Er ändert dieselben
// Einheiten, die der Fake-Leser liefert, und prüft wie das echte Repository Haushalt und Status.
import type { StockProductUnit } from '@/features/inventory/domain/stock-entry'

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

export function createFakeUnitWriter(data: FakeWriterData) {
  const calls: TakeOutCall[] = []
  // Wer welche Packung entnommen hat, für „Rückgängig nur die eigene Entnahme“
  const takenBy = new Map<string, string>()
  const find = (householdId: string, unitId: string) =>
    householdId === data.householdId ? data.units.find((unit) => unit.id === unitId) : undefined
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
      if (unit?.status !== 'consumed' || takenBy.get(unitId) !== userId) {
        return Promise.resolve('not-found' as const)
      }
      unit.status = 'stock'
      takenBy.delete(unitId)
      return Promise.resolve('updated' as const)
    },
  }
}
