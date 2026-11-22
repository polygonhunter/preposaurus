// Wiedererkennen beim manuellen Erfassen (UX §1): Passen Lebensmittelart, Inhalt und Behälter zu
// einem vorhandenen Produkt, bietet das Formular „Zu Nudeln 500 g hinzufügen?“ an. Gefragt wird aus
// Ereignissen (Auswahl, Feld verlassen), nicht bei jedem Tastendruck. Eine ältere Antwort, die nach
// einer neueren eintrifft, wird verworfen.
import { useRef, useState } from 'react'
import { parseContentQuantity } from '@/shared/lib/quantities'
import { findMatchingProductsAction } from '../actions/find-matching-products-action'
import type { ManualCaptureDraft } from './manual-capture-draft'

export type ProductMatch = Awaited<ReturnType<typeof findMatchingProductsAction>>[number]

type MatchFields = Pick<ManualCaptureDraft, 'foodTypeId' | 'content' | 'containerId'>

function matchQueryOf({ foodTypeId, content, containerId }: MatchFields) {
  const parsed = parseContentQuantity(content)
  if (foodTypeId === null || !parsed.ok) return null
  return { foodTypeId, content: parsed.value, containerId }
}

export function useProductMatches() {
  const [matches, setMatches] = useState<ProductMatch[]>([])
  const latestRequest = useRef(0)

  async function lookUpMatches(fields: MatchFields) {
    latestRequest.current += 1
    const request = latestRequest.current
    const query = matchQueryOf(fields)
    const found = query === null ? [] : await findMatchingProductsAction(query)
    if (request === latestRequest.current) setMatches(found)
  }

  function clearMatches() {
    latestRequest.current += 1
    setMatches([])
  }

  return { matches, lookUpMatches, clearMatches }
}
