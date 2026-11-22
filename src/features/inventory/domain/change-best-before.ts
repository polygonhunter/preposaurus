import type { BestBefore, StockUnit } from './unit'

type DatedUnit = Pick<StockUnit, 'bestBefore' | 'checkedAt'>

/**
 * Neues MHD für eine Packung, z. B. nachgetragen oder korrigiert (#47, #125). „Noch gut“ galt dem
 * alten Datum: Ändert sich das Datum, wird `geprueft_am` zurückgesetzt, sonst behielte eine
 * Packung mit neuem, wieder abgelaufenem Datum eine Prüfung, die niemand für dieses Datum gemacht
 * hat. Bleibt der Tag gleich (nur Genauigkeit oder Schätz-Kennzeichen ändern sich), bleibt sie.
 */
export function changeBestBefore<T extends DatedUnit>(unit: T, bestBefore: BestBefore | null): T {
  const isSameDay = unit.bestBefore?.date === bestBefore?.date
  return { ...unit, bestBefore, checkedAt: isSameDay ? unit.checkedAt : null }
}
