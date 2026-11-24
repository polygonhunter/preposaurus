import type { BestBefore, DateKind, StockUnit } from './unit'

type DatedUnit = Pick<StockUnit, 'bestBefore' | 'kind' | 'checkedAt'>

/**
 * Neues Datum für eine Packung, z. B. nachgetragen oder korrigiert (#47, #125), auf Wunsch mit
 * neuer Datumsart (#300). „Noch gut“ galt dem alten Datum als MHD: Ändert sich der Tag oder die
 * Art, wird `geprueft_am` zurückgesetzt, sonst behielte eine Packung eine Prüfung, die niemand für
 * dieses Datum gemacht hat (ein Verbrauchsdatum kennt „Noch gut“ gar nicht). Bleibt beides gleich
 * (nur Genauigkeit oder Schätz-Kennzeichen ändern sich), bleibt sie. Ohne Art bleibt die alte.
 */
export function changeBestBefore<T extends DatedUnit>(
  unit: T,
  bestBefore: BestBefore | null,
  kind: DateKind = unit.kind,
): T {
  const isSameCheck = unit.bestBefore?.date === bestBefore?.date && unit.kind === kind
  return { ...unit, bestBefore, kind, checkedAt: isSameCheck ? unit.checkedAt : null }
}
