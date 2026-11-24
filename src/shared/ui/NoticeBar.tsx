'use client'

type NoticeBarProps = Readonly<{ message: string; onDismiss: () => void }>

// Meldung, wenn etwas nicht geklappt hat oder ohne Verbindung nicht geht (UX-Konzept §7: „Nichts
// geht still verloren“). Sie steht dort, wo sonst die UndoBar steht, und bleibt, bis man sie schließt.
// Angesagt wird sie wie die UndoBar im NoticeAnnouncer des Aufrufers (role="alert", #274).
export function NoticeBar({ message, onDismiss }: NoticeBarProps) {
  return (
    <div
      data-focus-return
      role="group"
      aria-label={message}
      className="fixed inset-x-2 bottom-[calc(58px+env(safe-area-inset-bottom))] z-20 mx-auto flex max-w-[624px] items-center gap-3 rounded-group bg-fg py-1 pr-1 pl-4 text-callout text-bg breit:bottom-4"
    >
      <span aria-hidden="true" className="min-w-0 flex-1">
        {message}
      </span>
      <button type="button" onClick={onDismiss} className="min-h-11 px-3 font-semibold">
        Schließen
      </button>
    </div>
  )
}
