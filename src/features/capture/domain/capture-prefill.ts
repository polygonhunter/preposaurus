// Vorbelegung des Erfassens (#195, UX §8.4 „Packungen hinzufügen“, F5 „Gekauft und erfassen“):
// Ein Produkt aus der Adresse wird gleich als Nachschub gewählt, es geht direkt mit Datum und Anzahl
// weiter. Eine Lebensmittelart wird gewählt, und gibt es davon genau ein Produkt, auch dieses (wie
// beim Wählen der Art von Hand). Gilt nur, was in den Auswahllisten des Haushalts steht: Eine fremde
// oder ausgeblendete Art und ein fremdes Produkt belegen nichts vor.
import type { CaptureOptions, KnownProduct } from './capture-options'
import { findProductMatches, soleMatch } from './product-match'

export interface CapturePrefill {
  foodTypeId: string
  /** Vorgewähltes vorhandenes Produkt (Nachschub), sonst null */
  product: KnownProduct | null
}

interface PrefillIds {
  foodTypeId?: string | undefined
  productId?: string | undefined
}

type PrefillChoices = Pick<CaptureOptions, 'foodTypes' | 'knownProducts'>

function prefillFromProduct(choices: PrefillChoices, productId: string): CapturePrefill | null {
  const product = choices.knownProducts.find((known) => known.id === productId)
  const foodTypeId = product?.foodTypeId ?? null
  if (product === undefined || foodTypeId === null) return null
  if (!choices.foodTypes.some((foodType) => foodType.id === foodTypeId)) return null
  return { foodTypeId, product }
}

function prefillFromFoodType(choices: PrefillChoices, foodTypeId: string): CapturePrefill | null {
  if (!choices.foodTypes.some((foodType) => foodType.id === foodTypeId)) return null
  const matches = findProductMatches(choices.knownProducts, {
    foodTypeId,
    content: null,
    containerId: null,
  })
  return { foodTypeId, product: soleMatch(matches, { declinedIds: [], chosenContainerId: null }) }
}

/** Das Produkt geht vor, weil es genauer ist. Ohne gültige Angabe: keine Vorbelegung. */
export function resolvePrefill(choices: PrefillChoices, ids: PrefillIds): CapturePrefill | null {
  const fromProduct =
    ids.productId === undefined ? null : prefillFromProduct(choices, ids.productId)
  if (fromProduct !== null) return fromProduct
  return ids.foodTypeId === undefined ? null : prefillFromFoodType(choices, ids.foodTypeId)
}
