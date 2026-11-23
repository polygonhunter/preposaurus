'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { useIsOnline } from '@/shared/hooks/use-is-online'
import { NoticeBar } from '@/shared/ui/NoticeBar'
import { UndoBar } from '@/shared/ui/UndoBar'
import { consumeAction } from '../actions/consume-action'
import { undoConsumeAction } from '../actions/undo-consume-action'
import type { BestBeforeDto, ConsumeRequest } from '../schemas'
import { ConsumeContext, type TakenLabel } from './consume-context'
import { formatDate, formatTakenMessage } from './stock-format'

type Notice =
  | Readonly<{ kind: 'undo'; unitId: string; message: string }>
  | Readonly<{ kind: 'error'; message: string }>

const dateOf = (bestBefore: BestBeforeDto | null) =>
  bestBefore === null ? null : formatDate(bestBefore)

type ConsumeProviderProps = Readonly<{ children: ReactNode }>

// Erfolg zeigt fünf Sekunden „Rückgängig“, keine Rückfrage vorher (UX-Konzept §7, P7). Ein Fehler
// steht unten an derselben Stelle, die Seite lädt dabei neu, die Zeile springt also zurück.
export function ConsumeProvider({ children }: ConsumeProviderProps) {
  const [notice, setNotice] = useState<Notice | null>(null)
  const [isPending, startTransition] = useTransition()
  // Ohne Verbindung sind die Knöpfe gesperrt, der Hinweis oben auf der Seite sagt warum.
  const isOnline = useIsOnline()
  const isLocked = isPending || !isOnline

  const consume = (request: ConsumeRequest, { name, dateLabel }: TakenLabel) => {
    startTransition(async () => {
      const result = await consumeAction(request)
      setNotice(
        result.ok
          ? {
              kind: 'undo',
              unitId: result.taken.unitId,
              message: formatTakenMessage(name, dateLabel ?? dateOf(result.taken.bestBefore)),
            }
          : { kind: 'error', message: result.message },
      )
    })
  }

  const undo = (unitId: string) => {
    setNotice(null)
    startTransition(async () => {
      const result = await undoConsumeAction(unitId)
      if (!result.ok) setNotice({ kind: 'error', message: result.message })
    })
  }

  const dismiss = () => {
    setNotice(null)
  }

  return (
    <ConsumeContext value={{ consume, isLocked }}>
      {children}
      {notice?.kind === 'undo' ? (
        <UndoBar
          key={notice.unitId}
          message={notice.message}
          onUndo={() => {
            undo(notice.unitId)
          }}
          onDismiss={dismiss}
        />
      ) : null}
      {notice?.kind === 'error' ? <NoticeBar message={notice.message} onDismiss={dismiss} /> : null}
    </ConsumeContext>
  )
}
