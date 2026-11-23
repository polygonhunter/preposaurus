// Wiedererkennen statt doppelt anlegen (UX §1, F2, #207): Passt ein vorhandenes Produkt zu dem, was
// im Formular schon feststeht, bietet die App „Zu Nudeln 500 g hinzufügen?“ an. Schon die
// Lebensmittelart allein reicht, wenn es davon nur wenige Produkte gibt. Ein freiwilliges Feld, das
// leer ist (Inhalt noch nicht getippt, Behälter nicht gewählt), schließt kein Produkt aus. So
// entsteht kein Doppel, nur weil der Behälter fehlt. Der Lagerort zählt nicht mit.
import type { ContentQuantity } from '@/shared/lib/quantities'

export interface ProductIdentity {
  foodTypeId: string | null
  content: ContentQuantity
  containerId: string | null
}

/** Was im Formular schon feststeht. null heißt „noch offen“. */
export interface ProductWish {
  foodTypeId: string | null
  content: ContentQuantity | null
  containerId: string | null
}

// Mengen stehen als numeric(9,2) in der DB. Kleinere Abweichungen sind Rundung, kein anderes Produkt.
const AMOUNT_TOLERANCE = 0.005

/** Ohne Inhalt bietet die App nur an, solange es so wenige Produkte der Art gibt. */
export const MAX_OFFERS_WITHOUT_CONTENT = 3

const isSameContent = (a: ContentQuantity, b: ContentQuantity) =>
  a.unit === b.unit && Math.abs(a.value - b.value) < AMOUNT_TOLERANCE

/** Der Behälter ist freiwillig: Fehlt er auf einer Seite, trennt er nicht. */
const isCompatibleContainer = (a: string | null, b: string | null) =>
  a === null || b === null || a === b

export function fitsWish(candidate: ProductIdentity, wish: ProductWish): boolean {
  if (candidate.foodTypeId === null || candidate.foodTypeId !== wish.foodTypeId) return false
  if (wish.content !== null && !isSameContent(candidate.content, wish.content)) return false
  return isCompatibleContainer(candidate.containerId, wish.containerId)
}

/** Passende Produkte in der gegebenen Reihenfolge. Ohne Inhalt nur, wenn es wenige sind. */
export function findProductMatches<T extends ProductIdentity>(
  candidates: readonly T[],
  wish: ProductWish,
): T[] {
  const fitting = candidates.filter((candidate) => fitsWish(candidate, wish))
  if (wish.content === null && fitting.length > MAX_OFFERS_WITHOUT_CONTENT) return []
  return fitting
}

interface SoleMatchContext {
  /** Mit „Neu anlegen“ abgewählte Produkte: Sie werden nicht erneut vorgewählt. */
  declinedIds: readonly string[]
  /** Behälter im Formular, null wenn keiner gewählt ist */
  chosenContainerId: string | null
}

/**
 * Das eine passende Produkt, das die App vorwählt, sonst null. Es bleibt sichtbar und lässt sich mit
 * „Neu anlegen“ abwählen. Die Vorwahl überschreibt keine Wahl: Hat das Produkt keinen oder einen
 * anderen Behälter als den gewählten, wird es nur angeboten, nicht vorgewählt.
 */
export function soleMatch<T extends { id: string; containerId: string | null }>(
  matches: readonly T[],
  { declinedIds, chosenContainerId }: SoleMatchContext,
): T | null {
  const [only, ...others] = matches
  if (only === undefined || others.length > 0) return null
  if (chosenContainerId !== null && only.containerId !== chosenContainerId) return null
  return declinedIds.includes(only.id) ? null : only
}
