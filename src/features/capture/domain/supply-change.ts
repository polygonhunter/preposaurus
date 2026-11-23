// Was eine Erfassung an „Heute versorgt“ ändert (#231, UX-Konzept §8.5 „Danach“). Es zählt nur eine
// spürbare Änderung: Die ganze Zahl der Tage muss sich ändern, sonst bleibt der Satz weg. Essen geht
// vor Wasser; Wasser hat keine kcal, eine Erfassung ändert also praktisch immer nur eines von beiden.

/** Tage vor bzw. nach dem Speichern, wie an den Balken der Übersicht. */
export interface SupplyDaysFigures {
  energyDays: number
  waterDays: number
}

export interface SupplyChange {
  resource: 'energy' | 'water'
  before: number
  after: number
}

const changed = (before: number, after: number) => Math.floor(before) !== Math.floor(after)

/** Die Änderung von Essen bzw. Wasser, wenn sich die ganzen Tage ändern, sonst null. */
export function compareSupplyDays(
  before: SupplyDaysFigures,
  after: SupplyDaysFigures,
): SupplyChange | null {
  if (changed(before.energyDays, after.energyDays)) {
    return { resource: 'energy', before: before.energyDays, after: after.energyDays }
  }
  if (changed(before.waterDays, after.waterDays)) {
    return { resource: 'water', before: before.waterDays, after: after.waterDays }
  }
  return null
}
