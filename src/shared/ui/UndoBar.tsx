'use client'

import { useEffect, useEffectEvent } from 'react'
import { BottomBar } from './BottomBar'

// Laut UX_KONZEPT §7: Erfolg zeigt fünf Sekunden lang „Rückgängig“.
const UNDO_WINDOW_MS = 5000

type BarAction = Readonly<{ label: string; onClick: () => void }>

type UndoBarProps = Readonly<{
  message: string
  onUndo: () => void
  // Wird nach fünf Sekunden aufgerufen; dann blendet der Aufrufer die Zeile aus
  onDismiss: () => void
  // Optionale zweite Handlung, z. B. „Nachkaufen“ oder „Jetzt erfassen“
  secondary?: BarAction
}>

// Erscheint die Zeile, bleibt der Fokus, wo er ist; angesagt wird sie im immer vorhandenen
// NoticeAnnouncer des Aufrufers (#274). Verschwindet sie mit dem Fokus, führt useFocusRescue zur
// Stelle der letzten Handlung zurück (data-focus-return an der BottomBar, #269).
export function UndoBar({ message, onUndo, onDismiss, secondary }: UndoBarProps) {
  // Eine neu erzeugte onDismiss-Funktion je Render startet die fünf Sekunden nicht neu, eine neue Meldung schon.
  const dismiss = useEffectEvent(onDismiss)
  useEffect(() => {
    const timer = setTimeout(() => {
      dismiss()
    }, UNDO_WINDOW_MS)
    return () => {
      clearTimeout(timer)
    }
  }, [message])

  return (
    <BottomBar message={message}>
      {secondary ? (
        <button type="button" onClick={secondary.onClick} className="min-h-11 px-2 font-semibold">
          {secondary.label}
        </button>
      ) : null}
      <button type="button" onClick={onUndo} className="min-h-11 px-3 font-semibold">
        Rückgängig
      </button>
    </BottomBar>
  )
}
