'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition, type ReactNode } from 'react'
import { ActionErrorBar } from '@/shared/ui/ActionErrorBar'
import { UndoBar } from '@/shared/ui/UndoBar'
import { removeRestockItemAction } from '../actions/remove-restock-item-action'
import { setRestockItemDoneAction } from '../actions/set-restock-item-done-action'
import { RestockContext, type RestockEntry } from './restock-context'
import { RESTOCK_PATHS } from './restock-paths'

type Notice =
  Readonly<{ kind: 'checked'; entry: RestockEntry }> | Readonly<{ kind: 'error'; message: string }>

type RestockProviderProps = Readonly<{ children: ReactNode }>

// Nach dem Abhaken fünf Sekunden „Rückgängig“ und das Angebot „Jetzt erfassen“ (UX-Konzept §8.6,
// F5, #74). Ein Fehler steht unten an derselben Stelle, die Liste lädt dabei neu.
export function RestockProvider({ children }: RestockProviderProps) {
  const router = useRouter()
  const [notice, setNotice] = useState<Notice | null>(null)
  const [isPending, startTransition] = useTransition()

  const setDone = (entry: RestockEntry, isDone: boolean) => {
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
    <RestockContext value={{ setDone, remove, isPending }}>
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
              router.push(RESTOCK_PATHS.capture)
            },
          }}
        />
      ) : null}
      {notice?.kind === 'error' ? (
        <ActionErrorBar message={notice.message} onDismiss={dismiss} />
      ) : null}
    </RestockContext>
  )
}
