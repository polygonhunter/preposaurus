// Anteil der kcal aus Richtwerten (UX-Konzept §4). Ob daraus ein „ca.“ wird, entscheidet
// isApproximate in shared/lib/approximation.ts.

interface KcalContribution {
  kcal: number
  isKcalEstimated: boolean
}

/** Anteil der kcal (0 bis 1) aus Richtwerten bzw. unbestätigten Schätzungen. Ohne kcal: 0. */
export function estimatedKcalShare(units: readonly KcalContribution[]): number {
  let total = 0
  let estimated = 0
  for (const unit of units) {
    total += unit.kcal
    if (unit.isKcalEstimated) estimated += unit.kcal
  }
  return total > 0 ? estimated / total : 0
}
