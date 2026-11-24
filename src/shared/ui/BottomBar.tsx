'use client'

import { useId, type ReactNode } from 'react'
import type { HoldHandlers } from '@/shared/hooks/use-hold'

type BottomBarProps = Readonly<{
  message: string
  children: ReactNode
  // Hält die Zeit der UndoBar an, solange Zeiger oder Fokus in der Leiste sind (useHold)
  holdHandlers?: HoldHandlers
}>

// Die Leiste unten über der Tab-Leiste, Hülle von UndoBar und NoticeBar. Sie hat keine Live-Rolle,
// angesagt wird im NoticeAnnouncer des Aufrufers (#274). Die Gruppe heißt nach dem sichtbaren Text,
// wer per Tab zu „Rückgängig“ kommt, hört also, worum es geht. Der Text bleibt für Screenreader
// lesbar: Wer per Wischen oder Tasten liest oder auf dem Handy auf die Leiste tippt, findet ihn.
export function BottomBar({ message, children, holdHandlers }: BottomBarProps) {
  const messageId = useId()
  return (
    <div
      {...holdHandlers}
      data-focus-return
      role="group"
      aria-labelledby={messageId}
      className="fixed inset-x-2 bottom-[calc(58px+env(safe-area-inset-bottom))] z-20 mx-auto flex max-w-[624px] items-center gap-3 rounded-group bg-fg py-1 pr-1 pl-4 text-callout text-bg breit:bottom-4"
    >
      <span id={messageId} className="min-w-0 flex-1">
        {message}
      </span>
      {children}
    </div>
  )
}
