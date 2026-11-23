// Wiedererkennen beim Erfassen (UX §1, #207): Die vorhandenen Produkte kommen mit den Optionen,
// das Angebot „Zu Nudeln 500 g hinzufügen?“ entsteht deshalb ohne Anfrage im selben Tipp. Passt
// genau ein Produkt, wählt die App es aus Ereignissen heraus vor (Art gewählt, Inhalt verlassen,
// Behälter gewählt), nie beim Tippen. „Neu anlegen“ merkt sich das Produkt, es kommt nicht wieder.
import { useState } from 'react'
import { formatQuantity, parseContentQuantity } from '@/shared/lib/quantities'
import type { KnownProduct } from '../domain/capture-options'
import { findProductMatches, soleMatch, type ProductWish } from '../domain/product-match'

export type ProductMatch = KnownProduct

export interface MatchFields {
  foodTypeId: string | null
  content: string
  containerId: string | null
}

function wishOf({ foodTypeId, content, containerId }: MatchFields): ProductWish {
  const parsed = parseContentQuantity(content)
  return { foodTypeId, content: parsed.ok ? parsed.value : null, containerId }
}

/** Was beim Wählen eines vorhandenen Produkts ins Formular übernommen wird. */
export function fieldsOfProduct(product: KnownProduct) {
  return {
    existingProductId: product.id,
    content: formatQuantity(product.content),
    containerId: product.containerId,
  }
}

export type RestockUpdate = ReturnType<typeof fieldsOfProduct> | { existingProductId: null }

export type RestockFields = MatchFields & { existingProductId: string | null }

/**
 * Wiedererkennen für Formular und Foto-Weg. `apply` übernimmt die Änderung in den jeweiligen
 * Zustand, ausgehend von `fields` (dem Stand nach dem auslösenden Ereignis).
 */
export function useRestock<F extends RestockFields>(
  knownProducts: readonly KnownProduct[],
  apply: (fields: F, update: RestockUpdate) => void,
) {
  const [declinedIds, setDeclinedIds] = useState<readonly string[]>([])
  const matchesFor = (fields: MatchFields) => findProductMatches(knownProducts, wishOf(fields))

  /** Nach einem Ereignis genau ein passendes Produkt vorwählen. true, wenn eines gewählt ist. */
  function pickSoleMatch(fields: F): boolean {
    if (fields.foodTypeId === null || fields.existingProductId !== null) return false
    const sole = soleMatch(matchesFor(fields), {
      declinedIds,
      chosenContainerId: fields.containerId,
    })
    if (sole !== null) apply(fields, fieldsOfProduct(sole))
    return sole !== null
  }

  /** „Zu … hinzufügen“ bzw. „Neu anlegen“ (null). Abgewähltes wird nicht wieder vorgewählt. */
  function chooseProduct(current: F, productId: string | null) {
    const product = knownProducts.find((known) => known.id === productId)
    if (product !== undefined) {
      apply(current, fieldsOfProduct(product))
      return
    }
    const declined = current.existingProductId
    if (declined !== null) setDeclinedIds((previous) => [...previous, declined])
    apply(current, { existingProductId: null })
  }

  return {
    matchesFor,
    pickSoleMatch,
    chooseProduct,
    resetDeclined: () => {
      setDeclinedIds([])
    },
  }
}
