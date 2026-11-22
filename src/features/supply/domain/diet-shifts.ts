import { err, ok, type Result } from '@/shared/lib/result'
import type { DietShift, DietShifts, GroupTarget } from './group-targets'

// Die Verteilung nach Ernährungsform kommt als Daten herein. Fehlerhafte Daten dürfen keine
// Zielmenge stillschweigend verlieren oder erfinden, deshalb wird vor dem Rechnen geprüft.

export type DietShiftError =
  | { kind: 'unknown-group'; groupKey: string }
  | { kind: 'shares-not-one'; from: string; sum: number }
  | { kind: 'mixed-units'; from: string; to: string }

// Anteile wie 2/3 + 1/3 ergeben in Gleitkomma nicht immer exakt 1
const SHARE_TOLERANCE = 1e-9

function checkShift(
  shift: DietShift,
  units: ReadonlyMap<string, GroupTarget['unit']>,
): DietShiftError | null {
  const fromUnit = units.get(shift.from)
  if (fromUnit === undefined) return { kind: 'unknown-group', groupKey: shift.from }
  for (const { groupKey } of shift.to) {
    const toUnit = units.get(groupKey)
    if (toUnit === undefined) return { kind: 'unknown-group', groupKey }
    if (toUnit !== fromUnit) return { kind: 'mixed-units', from: shift.from, to: groupKey }
  }
  const sum = shift.to.reduce((total, { share }) => total + share, 0)
  if (Math.abs(sum - 1) > SHARE_TOLERANCE) return { kind: 'shares-not-one', from: shift.from, sum }
  return null
}

/** Jede Verschiebung bleibt in bekannten Gruppen derselben Einheit, die Anteile ergeben 1. */
export function validateDietShifts(
  targets: readonly GroupTarget[],
  dietShifts: DietShifts,
): Result<DietShifts, DietShiftError> {
  const units = new Map(targets.map((target) => [target.groupKey, target.unit]))
  for (const shift of Object.values(dietShifts).flat()) {
    const error = checkShift(shift, units)
    if (error) return err(error)
  }
  return ok(dietShifts)
}
