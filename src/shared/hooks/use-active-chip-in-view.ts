'use client'

import { useEffect, useRef } from 'react'

const ACTIVE_CHIP = '[aria-current="true"], [aria-pressed="true"]'

/** Rollt die Reihe waagerecht so weit, dass der Chip ganz zu sehen ist. Die Seite rollt nicht mit. */
function revealInRow(row: HTMLElement, chip: HTMLElement): void {
  const rowBox = row.getBoundingClientRect()
  const chipBox = chip.getBoundingClientRect()
  const padding = parseFloat(getComputedStyle(row).paddingLeft) || 0
  if (chipBox.right > rowBox.right - padding) {
    row.scrollLeft += chipBox.right - rowBox.right + padding
  } else if (chipBox.left < rowBox.left + padding) {
    row.scrollLeft -= rowBox.left + padding - chipBox.left
  }
}

/**
 * Hält den aktiven Chip einer waagerecht rollenden Reihe im Bild, auch wenn er weit rechts steht
 * (z. B. „Unvollständig“ auf dem iPhone). Geprüft wird nach jedem Zeichnen, weil ein Filterwechsel
 * per Link die Reihe nicht neu einhängt. Gerollt wird nur, wenn ein anderer Chip aktiv geworden ist:
 * Wer die Reihe selbst verschoben hat, behält seine Stelle, auch wenn die Seite neu zeichnet.
 */
export function useActiveChipInView<T extends HTMLElement>() {
  const rowRef = useRef<T>(null)
  const revealedRef = useRef<HTMLElement | null>(null)
  useEffect(() => {
    const row = rowRef.current
    const chip = row?.querySelector<HTMLElement>(ACTIVE_CHIP) ?? null
    if (chip === revealedRef.current) return
    revealedRef.current = chip
    if (row && chip) revealInRow(row, chip)
  })
  return rowRef
}
