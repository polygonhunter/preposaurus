'use client'

type ActionErrorBarProps = Readonly<{ message: string; onDismiss: () => void }>

// Meldung, wenn eine Entnahme nicht geklappt hat (UX-Konzept §7: „Nichts geht still verloren“).
// Sie steht dort, wo sonst die UndoBar steht, und bleibt, bis man sie schließt.
export function ActionErrorBar({ message, onDismiss }: ActionErrorBarProps) {
  return (
    <div
      role="alert"
      className="fixed inset-x-2 bottom-[calc(58px+env(safe-area-inset-bottom))] z-20 mx-auto flex max-w-[624px] items-center gap-3 rounded-group bg-fg py-1 pr-1 pl-4 text-callout text-bg breit:bottom-4"
    >
      <span className="min-w-0 flex-1">{message}</span>
      <button type="button" onClick={onDismiss} className="min-h-11 px-3 font-semibold">
        Schließen
      </button>
    </div>
  )
}
