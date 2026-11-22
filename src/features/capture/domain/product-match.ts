// Wiedererkennen statt doppelt anlegen (UX §1): Passen Lebensmittelart, Menge je Packung und
// Behälter, schlägt die App „Zu Spaghetti 500 g hinzufügen?“ vor. Es bleibt ein Vorschlag, der
// Lagerort zählt nicht mit (ein Produkt an zwei Orten sind zwei Produkte, Freigabe L10).
import type { ContentQuantity } from '@/shared/lib/quantities'

export interface ProductIdentity {
  foodTypeId: string | null
  content: ContentQuantity
  containerId: string | null
}

// Mengen stehen als numeric(9,2) in der DB. Kleinere Abweichungen sind Rundung, kein anderes Produkt.
const AMOUNT_TOLERANCE = 0.005

export function isSameProduct(candidate: ProductIdentity, wanted: ProductIdentity): boolean {
  return (
    candidate.foodTypeId !== null &&
    candidate.foodTypeId === wanted.foodTypeId &&
    candidate.content.unit === wanted.content.unit &&
    Math.abs(candidate.content.value - wanted.content.value) < AMOUNT_TOLERANCE &&
    candidate.containerId === wanted.containerId
  )
}
