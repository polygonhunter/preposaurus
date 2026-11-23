// „ca.“ vor einer Zahl heißt „enthält Richtwerte“ (UX-Konzept §4). Damit es ruhig bleibt, steht es
// erst ab einem spürbaren Anteil an der Zahl, darunter nennt ihn nur das Erklär-Blatt. Liegt in
// shared/lib, weil Übersicht und Detail des Vorrats den Anteil gleich benennen (#219, #230).

/** Ab diesem Anteil der kcal aus Richtwerten bzw. unbestätigten Schätzungen steht „ca.“ (#115). */
const APPROXIMATE_SHARE_THRESHOLD = 0.1
// Gleitkomma: 0,7 von 7 kcal ergibt 0,0999…, das ist genau 10 % und soll „ca.“ bekommen
const SHARE_EPSILON = 1e-9
const PERCENT = 100

/** Bekommt die Zahl ein „ca.“? Ab 10 % Richtwert-Anteil, genau 10 % eingeschlossen. */
export function isApproximate(estimatedShare: number): boolean {
  return estimatedShare + SHARE_EPSILON >= APPROXIMATE_SHARE_THRESHOLD
}

/** Die Schwelle als ganze Prozent, z. B. 10. */
export const APPROXIMATE_THRESHOLD_PERCENT = Math.round(APPROXIMATE_SHARE_THRESHOLD * PERCENT)

/**
 * Anteil in Worten: „etwa 12 %“, „weniger als 1 %“. Unter der Schwelle nie „etwa 10 %“, sonst
 * widerspräche der Satz „Hier ist es weniger.“
 */
export function estimatedSharePercentText(share: number): string {
  const rounded = Math.round(share * PERCENT)
  const percent = isApproximate(share)
    ? rounded
    : Math.min(rounded, APPROXIMATE_THRESHOLD_PERCENT - 1)
  return percent === 0 ? 'weniger als 1 %' : `etwa ${String(percent)} %`
}
