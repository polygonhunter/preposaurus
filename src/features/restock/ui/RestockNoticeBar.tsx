'use client'

import { useRouter } from 'next/navigation'
import { NoticeBar } from '@/shared/ui/NoticeBar'
import { UndoBar } from '@/shared/ui/UndoBar'
import { captureHref } from './restock-paths'
import type { RestockActions, RestockNotice } from './use-restock-actions'

type RestockNoticeBarProps = Readonly<{
  notice: RestockNotice
  actions: RestockActions
  onDismiss: () => void
}>

// Die eine Meldung unten auf der Seite Nachkaufen. Nach dem Abhaken bietet sie zusätzlich
// „Jetzt erfassen“ an (UX-Konzept §8.6, F5, #74), nach dem Entfernen, „Auf die Liste“ und
// Ausblenden nur „Rückgängig“ (#202, #200, #201).
export function RestockNoticeBar({ notice, actions, onDismiss }: RestockNoticeBarProps) {
  const router = useRouter()
  switch (notice.kind) {
    case 'checked':
      return (
        <UndoBar
          key={`checked-${notice.entry.id}`}
          message={`${notice.entry.label} abgehakt.`}
          onUndo={() => {
            actions.setDone(notice.entry, false)
          }}
          onDismiss={onDismiss}
          secondary={{
            label: 'Jetzt erfassen',
            onClick: () => {
              router.push(captureHref(notice.entry))
            },
          }}
        />
      )
    case 'removed':
      return (
        <UndoBar
          key={`removed-${notice.item.id}`}
          message={`${notice.item.label} entfernt.`}
          onUndo={() => {
            actions.restore(notice.item)
          }}
          onDismiss={onDismiss}
        />
      )
    case 'listed':
      return (
        <UndoBar
          key={`listed-${notice.entry.id}`}
          message={`${notice.entry.label} steht jetzt auf der Liste.`}
          onUndo={() => {
            actions.unlist(notice.entry)
          }}
          onDismiss={onDismiss}
        />
      )
    case 'hidden':
      return (
        <UndoBar
          key={`hidden-${notice.entry.id}`}
          message={`${notice.entry.label} ausgeblendet.`}
          onUndo={() => {
            actions.unlist(notice.entry)
          }}
          onDismiss={onDismiss}
        />
      )
    case 'error':
      return <NoticeBar message={notice.message} onDismiss={onDismiss} />
  }
}
