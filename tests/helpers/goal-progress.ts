import type { GoalProgress } from '@/features/supply/domain/goal-progress'
import type { SupplyUnit } from '@/features/supply/domain/supply-days'

/** Stand am Zieldatum, wenn das Zieldatum gültig ist. Sonst bricht der Test ab. */
export function reachable<T extends SupplyUnit>(
  result: { ok: true; value: GoalProgress<T> } | { ok: false },
) {
  if (!result.ok || result.value.target.kind !== 'valid') throw new Error('kein gültiges Ziel')
  return result.value.target
}
