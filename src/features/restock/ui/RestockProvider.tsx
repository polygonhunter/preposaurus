'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition, type ReactNode } from 'react'
import { useIsOnline } from '@/shared/hooks/use-is-online'
import { NoticeBar } from '@/shared/ui/NoticeBar'
import { OFFLINE_WRITE_MESSAGE } from '@/shared/ui/OfflineWriteGuard'
import { UndoBar } from '@/shared/ui/UndoBar'
import { removeRestockItemAction } from '../actions/remove-restock-item-action'
import { setRestockItemDoneAction } from '../actions/set-restock-item-done-action'
import { RestockContext, type RestockEntry } from './restock-context'
import { captureHref } from './restock-paths'

type Notice =
  Readonly<{ kind: 'checked'; entry: RestockEntry }> | Readonly<{ kind: 'error'; message: string }>

type RestockProviderProps = Readonly<{ children: ReactNode }>

// Nach dem Abhaken fünf Sekunden „Rückgängig“ und das Angebot „Jetzt erfassen“ (UX-Konzept §8.6,
// F5, #74). Ein Fehler steht unten an derselben Stelle, die Liste lädt dabei neu.
export function RestockProvider({ children }: RestockProviderProps) {
  const router = useRouter()
  const [notice, setNotice] = useState<Notice | null>(null)
  const [isPending, startTransition] = useTransition()
  // Ohne Verbindung sind Haken und Entfernen gesperrt (wie „−1“ im Vorrat, M10)
  const isOnline = useIsOnline()
  const isLocked = isPending || !isOnline

  const setDone = (entry: RestockEntry, isDone: boolean) => {
    // „Rückgängig“ steht fünf Sekunden da, die Verbindung kann in der Zeit wegfallen
    if (!isOnline) {
      setNotice({ kind: 'error', message: OFFLINE_WRITE_MESSAGE })
      return
    }
    setNotice(null)
    startTransition(async () => {
      const result = await setRestockItemDoneAction({ id: entry.id, isDone })
      if (!result.ok) setNotice({ kind: 'error', message: result.message })
      else if (isDone) setNotice({ kind: 'checked', entry })
    })
  }

  const remove = (entry: RestockEntry) => {
    setNotice(null)
    startTransition(async () => {
      const result = await removeRestockItemAction(entry.id)
      if (!result.ok) setNotice({ kind: 'error', message: result.message })
    })
  }

  const dismiss = () => {
    setNotice(null)
  }

  return (
    <RestockContext value={{ setDone, remove, isLocked }}>
      {children}
      {notice?.kind === 'checked' ? (
        <UndoBar
          key={notice.entry.id}
          message={`${notice.entry.label} abgehakt.`}
          onUndo={() => {
            setDone(notice.entry, false)
          }}
          onDismiss={dismiss}
          secondary={{
            label: 'Jetzt erfassen',
            onClick: () => {
              router.push(captureHref(notice.entry))
            },
          }}
        />
      ) : null}
      {notice?.kind === 'error' ? <NoticeBar message={notice.message} onDismiss={dismiss} /> : null}
    </RestockContext>
  )
}
