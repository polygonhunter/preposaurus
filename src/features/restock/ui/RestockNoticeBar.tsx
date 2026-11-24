'use client'

import { useRouter } from 'next/navigation'
import { NoticeBar } from '@/shared/ui/NoticeBar'
import { UndoBar } from '@/shared/ui/UndoBar'
import { restockNoticeKey, restockNoticeMessage } from './restock-notice-text'
import { captureHref } from './restock-paths'
import type { RestockActions, RestockNotice } from './use-restock-actions'

type RestockNoticeBarProps = Readonly<{
  notice: RestockNotice
  actions: RestockActions
  onDismiss: () => void
}>

const undoOf = (notice: RestockNotice, actions: RestockActions) => {
  switch (notice.kind) {
    case 'checked':
      return () => {
        actions.setDone(notice.entry, false)
      }
    case 'removed':
      return () => {
        actions.restore(notice.item)
      }
    case 'listed':
    case 'hidden':
      return () => {
        actions.unlist(notice.entry)
      }
    case 'error':
      return null
  }
}

// Die eine sichtbare Meldung unten auf der Seite Nachkaufen; angesagt wird sie im NoticeAnnouncer
// des Providers (#274). Nach dem Abhaken bietet sie zusätzlich „Jetzt erfassen“ an (UX-Konzept
// §8.6, F5, #74), nach dem Entfernen, „Auf die Liste“ und Ausblenden nur „Rückgängig“ (#202, #200,
// #201).
export function RestockNoticeBar({ notice, actions, onDismiss }: RestockNoticeBarProps) {
  const router = useRouter()
  const message = restockNoticeMessage(notice)
  const undo = undoOf(notice, actions)
  if (undo === null) return <NoticeBar message={message} onDismiss={onDismiss} />
  const capture =
    notice.kind === 'checked'
      ? {
          secondary: {
            label: 'Jetzt erfassen',
            onClick: () => {
              router.push(captureHref(notice.entry))
            },
          },
        }
      : {}
  return (
    <UndoBar
      key={restockNoticeKey(notice)}
      message={message}
      onUndo={undo}
      onDismiss={onDismiss}
      {...capture}
    />
  )
}
