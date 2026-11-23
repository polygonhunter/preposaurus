'use client'

import { useEffect, useEffectEvent } from 'react'

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

// Erscheint die Zeile, bleibt der Fokus, wo er ist (role="status" sagt sie an). Verschwindet sie mit
// dem Fokus, führt useFocusRescue zur Stelle der letzten Handlung zurück (data-focus-return, #269).
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
    <div
      data-focus-return
      role="status"
      className="fixed inset-x-2 bottom-[calc(58px+env(safe-area-inset-bottom))] z-20 mx-auto flex max-w-[624px] items-center gap-3 rounded-group bg-fg py-1 pr-1 pl-4 text-callout text-bg breit:bottom-4"
    >
      <span className="min-w-0 flex-1">{message}</span>
      {secondary ? (
        <button type="button" onClick={secondary.onClick} className="min-h-11 px-2 font-semibold">
          {secondary.label}
        </button>
      ) : null}
      <button type="button" onClick={onUndo} className="min-h-11 px-3 font-semibold">
        Rückgängig
      </button>
    </div>
  )
}
