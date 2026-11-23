'use client'

import { useEffect } from 'react'

// Ausgewählte Zeile in Liste oder Tabelle (`aria-current="page"` im Bereich `data-stock-list`)
const SELECTED = '[data-stock-list] [aria-current="page"]'

const isShown = (element: HTMLElement) => element.getClientRects().length > 0

// Mit jeder Auswahl lädt die Seite neu, die Liste daneben finge oben an. So bleibt die gewählte
// Zeile im Blick, ohne dass die Seite selbst springt (nur die Rolle der Liste bewegt sich).
export function ScrollToSelected() {
  useEffect(() => {
    const shown = [...document.querySelectorAll<HTMLElement>(SELECTED)].find(isShown)
    shown?.scrollIntoView({ block: 'nearest' })
  }, [])
  return null
}
