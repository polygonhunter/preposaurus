// Adressen rund um eine Zeile im Vorrat (#45, #49, #195), an einer Stelle für Vorrat, Erfassen und
// Nachkaufen: Detailseite, Bearbeiten, Datum ändern und das vorbelegte Erfassen. Die Parameter
// heißen deutsch, geprüft werden sie dort, wo die Seite sie liest.

/** Lebensmittelart oder Produkt ohne Lebensmittelart (wie `StockTarget` im Vorrat). */
interface PathTarget {
  kind: 'food-type' | 'product'
  id: string
}

const STOCK_PATH = '/vorrat'
const CAPTURE_PATH = '/neu'
const MANUAL_CAPTURE_PATH = '/neu/manuell'

/** Vorbelegung des Erfassens aus der Adresse: Lebensmittelart bzw. Produkt (#195). */
export const CAPTURE_PREFILL_PARAMS = { 'food-type': 'art', product: 'produkt' } as const

export const detailPath = ({ kind, id }: PathTarget) =>
  `${STOCK_PATH}/${kind === 'food-type' ? 'art' : 'produkt'}/${id}`

export const productEditPath = (productId: string) =>
  `${STOCK_PATH}/produkt/${productId}/bearbeiten`

/** Datum ändern bzw. nachtragen für die Datumszeile, zu der diese Packung gehört (#49). */
export const unitDatePath = (unitId: string) => `${STOCK_PATH}/packung/${unitId}/datum`

/**
 * Erfassen vorbelegt (#195, UX §8.4 „Packungen hinzufügen“): immer der manuelle Weg, weil dort
 * Datum und Anzahl gleich auf der ersten Seite stehen. Ohne Ziel das normale Erfassen (`/neu`,
 * mit der Frage nach einem offenen Entwurf).
 */
export function prefilledCapturePath(target: PathTarget | null): string {
  if (target === null) return CAPTURE_PATH
  const params = new URLSearchParams({ [CAPTURE_PREFILL_PARAMS[target.kind]]: target.id })
  return `${MANUAL_CAPTURE_PATH}?${params.toString()}`
}
