'use client'

import { BottomBar } from './BottomBar'

type NoticeBarProps = Readonly<{ message: string; onDismiss: () => void }>

// Meldung, wenn etwas nicht geklappt hat oder ohne Verbindung nicht geht (UX-Konzept §7: „Nichts
// geht still verloren“). Sie steht dort, wo sonst die UndoBar steht, und bleibt, bis man sie schließt.
// Angesagt wird sie wie die UndoBar im NoticeAnnouncer des Aufrufers (role="alert", #274).
export function NoticeBar({ message, onDismiss }: NoticeBarProps) {
  return (
    <BottomBar message={message}>
      <button type="button" onClick={onDismiss} className="min-h-11 px-3 font-semibold">
        Schließen
      </button>
    </BottomBar>
  )
}
