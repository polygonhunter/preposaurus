'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { useIsOnline } from '@/shared/hooks/use-is-online'
import { NoticeBar } from '@/shared/ui/NoticeBar'
import { OFFLINE_WRITE_MESSAGE } from '@/shared/ui/OfflineWriteGuard'
import { UndoBar } from '@/shared/ui/UndoBar'
import { ConsumeContext, type ConsumeContextValue } from './consume-context'
import {
  errorNotice,
  noticeKey,
  runConsume,
  runDiscard,
  runPutOnRestock,
  runStillGood,
  runUndo,
  type Notice,
  type TakeOutNotice,
  type UndoNotice,
} from './unit-notices'

// Zweites Angebot der Rückgängig-Zeile nach Verbraucht oder Entsorgt, solange das Produkt nicht
// auf die Liste gesetzt ist. Nach „Noch gut“ bleibt die Packung im Vorrat, dort gibt es keins.
const restockOffer = (notice: UndoNotice, putOn: (notice: TakeOutNotice) => void) =>
  notice.kind === 'still-good' || notice.isListed
    ? {}
    : {
        secondary: {
          label: 'Nachkaufen',
          onClick: () => {
            putOn(notice)
          },
        },
      }

type ConsumeProviderProps = Readonly<{ children: ReactNode }>

// Erfolg zeigt fünf Sekunden „Rückgängig“, keine Rückfrage vorher (UX-Konzept §7, P7), dazu das
// Angebot „Nachkaufen“ (UX D15, #74). Ein Fehler steht unten an derselben Stelle, die Seite lädt
// dabei neu, die Zeile springt also zurück.
export function ConsumeProvider({ children }: ConsumeProviderProps) {
  const [notice, setNotice] = useState<Notice | null>(null)
  const [isPending, startTransition] = useTransition()
  // Ohne Verbindung sind die Knöpfe gesperrt, der Hinweis oben auf der Seite sagt warum.
  const isOnline = useIsOnline()

  const run = (task: () => Promise<Notice | null>) => {
    startTransition(async () => {
      setNotice(await task())
    })
  }

  // Ohne Verbindung sagt ein Tipp, warum es nicht geht (UX-Konzept §7, #216). Auch die
  // Rückgängig-Zeile steht fünf Sekunden da, die Verbindung kann in der Zeit wegfallen.
  const isOfflineNow = () => {
    if (isOnline) return false
    setNotice(errorNotice(OFFLINE_WRITE_MESSAGE))
    return true
  }

  // Die Knöpfe sind nur per aria-disabled gesperrt: Ein echtes disabled nähme ihnen den Fokus, er
  // fiele nach „−1“ per Tastatur auf body (#218). Darum fängt der Provider den Tipp selbst ab.
  const runAction = (task: () => Promise<Notice | null>) => {
    if (isPending || isOfflineNow()) return
    run(task)
  }

  const undo = (current: UndoNotice) => {
    if (isOfflineNow()) return
    setNotice(null)
    run(() => runUndo(current))
  }

  // Das Angebot verschwindet sofort, damit ein zweiter schneller Tipp nichts mehr auslöst
  const putOnRestockList = (current: TakeOutNotice) => {
    if (isOfflineNow()) return
    setNotice({ ...current, isListed: true })
    run(() => runPutOnRestock(current))
  }

  const dismiss = () => {
    setNotice(null)
  }

  const value: ConsumeContextValue = {
    isLocked: isPending || !isOnline,
    consume: (request, label) => {
      runAction(() => runConsume(request, label))
    },
    discard: (unitId, label) => {
      runAction(() => runDiscard(unitId, label))
    },
    markStillGood: (unitIds, label) => {
      runAction(() => runStillGood(unitIds, label))
    },
  }

  return (
    <ConsumeContext value={value}>
      {children}
      {notice === null || notice.kind === 'error' ? null : (
        <UndoBar
          key={noticeKey(notice)}
          message={notice.message}
          onUndo={() => {
            undo(notice)
          }}
          onDismiss={dismiss}
          {...restockOffer(notice, putOnRestockList)}
        />
      )}
      {notice?.kind === 'error' ? <NoticeBar message={notice.message} onDismiss={dismiss} /> : null}
    </ConsumeContext>
  )
}
