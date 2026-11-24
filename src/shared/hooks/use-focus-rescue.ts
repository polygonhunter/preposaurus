'use client'
// Verschwindet der fokussierte Knopf (Zeile entfernt, abgehakt, Rückgängig-Leiste zu), fällt der
// Fokus sonst auf body, und Tastatur und Screenreader verlieren die Stelle (#269). Der Hook führt
// ihn dann auf ein sinnvolles Ziel: dieselbe Zeile, falls sie neu geladen wieder da ist, sonst die
// nächste, die vorherige, die Überschrift der Liste. Ein Knopf in einer Leiste (data-focus-return)
// führt zurück zur Stelle der letzten Handlung. Erscheint eine Leiste nur, bleibt der Fokus, wo er
// ist. Solange eine Änderung läuft (`isPending`), wartet er, bis die Seite neu geladen ist.
import { usePathname } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef } from 'react'
import {
  actedControl,
  candidatesFor,
  canHoldFocus,
  focusFirst,
  isFocusLost,
  type ActedControl,
  type FocusCandidate,
} from './focus-targets'

interface FocusWatch {
  setPending: (isPending: boolean) => void
  /** Neue Seite: nichts mehr zu retten, keine Handlung mehr zurückzuholen */
  reset: () => void
  dispose: () => void
}

interface WatchState {
  isPending: boolean
  /** Ziele für das gerade fokussierte Element, null wenn es nichts zu retten gibt */
  armed: readonly FocusCandidate[] | null
  lastRow: readonly FocusCandidate[]
  acted: ActedControl | null
}

function rescue(state: WatchState): void {
  if (state.isPending || state.armed === null || !isFocusLost()) return
  const candidates = state.armed
  state.armed = null
  focusFirst(candidates)
}

function focusListeners(container: HTMLElement, state: WatchState) {
  return {
    focusin: (event: FocusEvent) => {
      if (!(event.target instanceof HTMLElement)) return
      const plan = candidatesFor(event.target, container, state)
      state.armed = plan?.candidates ?? null
      if (plan?.isRow === true) state.lastRow = plan.candidates
    },
    // Wechselt der Fokus woandershin oder klickt jemand ins Leere, gibt es nichts zu retten. Nur
    // ein Element, das weg oder gesperrt ist, hat den Fokus verloren.
    focusout: ({ target, relatedTarget }: FocusEvent) => {
      if (relatedTarget instanceof Node) {
        if (!container.contains(relatedTarget)) state.armed = null
        return
      }
      setTimeout(() => {
        if (target instanceof HTMLElement && canHoldFocus(target) && isFocusLost()) {
          state.armed = null
        }
      })
    },
  }
}

// Entfernte Zeilen, gesperrte Knöpfe und geschlossene Blätter nehmen den Fokus mit
const OBSERVED: MutationObserverInit = {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['disabled', 'open'],
}

function watchFocus(container: HTMLElement): FocusWatch {
  const state: WatchState = { isPending: false, armed: null, lastRow: [], acted: null }
  const { focusin, focusout } = focusListeners(container, state)
  const onClick = (event: MouseEvent) => {
    state.acted = actedControl(event.target) ?? state.acted
  }
  const observer = new MutationObserver(() => {
    rescue(state)
  })
  observer.observe(container, OBSERVED)
  container.addEventListener('focusin', focusin)
  container.addEventListener('focusout', focusout)
  container.addEventListener('click', onClick, { capture: true })
  return {
    setPending: (isPending) => {
      state.isPending = isPending
      rescue(state)
    },
    reset: () => {
      state.armed = null
      state.lastRow = []
      state.acted = null
    },
    dispose: () => {
      observer.disconnect()
      container.removeEventListener('focusin', focusin)
      container.removeEventListener('focusout', focusout)
      container.removeEventListener('click', onClick, { capture: true })
    },
  }
}

/**
 * Ref für den Bereich mit Zeilen und Leisten, meist der Provider einer Seite. Ist er das erste
 * Element einer Seite, braucht er eine eigene Box: Mit `display: contents` hat er keine
 * ClientRects, und Next.js rollt nach einem Seitenwechsel nicht mehr nach oben.
 */
export function useFocusRescue<T extends HTMLElement>(isPending: boolean) {
  const containerRef = useRef<T>(null)
  const watchRef = useRef<FocusWatch | null>(null)
  const pathname = usePathname()
  useEffect(() => {
    if (containerRef.current === null) return
    const watch = watchFocus(containerRef.current)
    watchRef.current = watch
    return () => {
      watch.dispose()
      watchRef.current = null
    }
  }, [])
  // Vor den MutationObserver-Rückrufen, damit sie schon den neuen Stand kennen
  useLayoutEffect(() => {
    watchRef.current?.setPending(isPending)
  }, [isPending])
  // Vor den MutationObserver-Rückrufen der neuen Seite
  useLayoutEffect(() => {
    watchRef.current?.reset()
  }, [pathname])
  return containerRef
}
