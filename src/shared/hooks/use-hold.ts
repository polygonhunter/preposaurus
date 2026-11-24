'use client'
// Hält etwas an, solange der Zeiger darüber liegt oder der Tastaturfokus darin steht (WCAG 2.2.1,
// #272). Für die Rückgängig-Zeile: Wer gerade zu „Rückgängig“ greift, verliert sie nicht mitten im
// Griff. Nur sichtbarer Fokus zählt: Nach einem Klick oder Tipp bliebe der Fokus sonst auf dem Knopf
// und die Zeile stünde, bis man woanders hinklickt.
import { useState, type FocusEvent } from 'react'

export type HoldHandlers = Readonly<{
  onPointerEnter: () => void
  onPointerLeave: () => void
  onFocus: (event: FocusEvent<HTMLElement>) => void
  onBlur: (event: FocusEvent<HTMLElement>) => void
}>

export function useHold(): Readonly<{ isHeld: boolean; handlers: HoldHandlers }> {
  const [isPointerOver, setPointerOver] = useState(false)
  const [hasFocus, setFocus] = useState(false)
  const handlers: HoldHandlers = {
    onPointerEnter: () => {
      setPointerOver(true)
    },
    onPointerLeave: () => {
      setPointerOver(false)
    },
    onFocus: ({ target }) => {
      if (target.matches(':focus-visible')) setFocus(true)
    },
    // Wandert der Fokus nur zum Nachbarknopf, bleibt er im Bereich
    onBlur: ({ currentTarget, relatedTarget }) => {
      if (!(relatedTarget instanceof Node && currentTarget.contains(relatedTarget))) setFocus(false)
    },
  }
  return { isHeld: isPointerOver || hasFocus, handlers }
}
