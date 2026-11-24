'use client'
// Zeitschaltuhr, die anhält, solange die Maus über dem Bereich liegt oder sichtbarer Fokus darin
// steht (WCAG 2.2.1, #272). Für die Rückgängig-Zeile: Wer gerade zu „Rückgängig“ greift, verliert
// sie nicht mitten im Griff. Danach beginnt die Zeit neu.
// - Nur sichtbarer Fokus zählt: Nach einem Klick bliebe der Fokus sonst auf dem Knopf, und die
//   Zeile stünde, bis man woanders hinklickt.
// - Der Fokus wird beim Ablauf am DOM geprüft, nicht als Zustand gemerkt: Verschwindet der
//   fokussierte Knopf („Nachkaufen“), kommt kein blur, und useFocusRescue führt den Fokus hinaus.
//   Ein gemerkter Zustand hielte die Zeile dann für immer.
// - Touch zählt nicht: Ein Tipp ist kurz, und am Handy gibt es kein „Zeiger liegt darüber“.
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type FocusEvent,
  type PointerEvent,
  type RefObject,
} from 'react'

export type HoldZone<T extends HTMLElement> = Readonly<{
  ref: RefObject<T | null>
  onPointerEnter: (event: PointerEvent<T>) => void
  onPointerLeave: () => void
  onBlur: (event: FocusEvent<T>) => void
}>

type HoldTimeout = Readonly<{
  ms: number
  onExpire: () => void
  /** Ändert sich der Wert (z. B. eine neue Meldung), beginnt die Zeit neu */
  restartKey: unknown
}>

const holdsVisibleFocus = (zone: HTMLElement | null) => {
  const active = document.activeElement
  return (
    zone !== null && active !== null && zone.contains(active) && active.matches(':focus-visible')
  )
}

export function useHoldTimeout<T extends HTMLElement>({
  ms,
  onExpire,
  restartKey,
}: HoldTimeout): HoldZone<T> {
  const ref = useRef<T>(null)
  const [isPointerOver, setPointerOver] = useState(false)
  // Fokus hat den Bereich verlassen: Die Zeit beginnt neu
  const [focusLeft, setFocusLeft] = useState(0)
  // Eine neu erzeugte onExpire-Funktion je Render startet die Zeit nicht neu
  const expire = useEffectEvent(onExpire)

  useEffect(() => {
    if (isPointerOver) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const wait = () => {
      timer = setTimeout(() => {
        if (holdsVisibleFocus(ref.current)) wait()
        else expire()
      }, ms)
    }
    wait()
    return () => {
      clearTimeout(timer)
    }
  }, [ms, restartKey, isPointerOver, focusLeft])

  return {
    ref,
    onPointerEnter: ({ pointerType }) => {
      if (pointerType !== 'touch') setPointerOver(true)
    },
    onPointerLeave: () => {
      setPointerOver(false)
    },
    // Wandert der Fokus nur zum Nachbarknopf, bleibt er im Bereich
    onBlur: ({ currentTarget, relatedTarget }) => {
      if (relatedTarget instanceof Node && currentTarget.contains(relatedTarget)) return
      setFocusLeft((count) => count + 1)
    },
  }
}
