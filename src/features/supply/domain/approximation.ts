// „ca.“ vor einer Zahl heißt „enthält Richtwerte“ (UX-Konzept §4). Damit es ruhig bleibt, steht es
// erst ab einem spürbaren Anteil an der Zahl, darunter nennt ihn nur das Erklär-Blatt.

/** Ab diesem Anteil der kcal aus Richtwerten bzw. unbestätigten Schätzungen steht „ca.“ (#115). */
const APPROXIMATE_SHARE_THRESHOLD = 0.1

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

/** Bekommt die Zahl ein „ca.“? Ab 10 % Richtwert-Anteil. */
export function isApproximate(estimatedShare: number): boolean {
  return estimatedShare >= APPROXIMATE_SHARE_THRESHOLD
}
