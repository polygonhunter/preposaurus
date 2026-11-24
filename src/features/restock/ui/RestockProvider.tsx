'use client'

import type { ReactNode } from 'react'
import { useFocusRescue } from '@/shared/hooks/use-focus-rescue'
import { NoticeAnnouncer } from '@/shared/ui/NoticeAnnouncer'
import { RestockContext } from './restock-context'
import { restockAnnouncement } from './restock-notice-text'
import { RestockNoticeBar } from './RestockNoticeBar'
import { useRestockActions } from './use-restock-actions'

type RestockProviderProps = Readonly<{ children: ReactNode }>

// Stellt den Zeilen Abhaken, Entfernen, „Auf die Liste“ und die Knöpfe der Lücken bereit und zeigt
// die eine Meldung unten (Rückgängig-Zeile oder Fehler). Nach jeder Änderung lädt die Liste neu
// (refresh in der Action). Verschwindet dabei der fokussierte Knopf, führt useFocusRescue den
// Fokus weiter (#269); der Bereich ist dafür ein eigenes Element. Angesagt wird die Meldung im
// immer vorhandenen NoticeAnnouncer (#274).
export function RestockProvider({ children }: RestockProviderProps) {
  const { notice, dismiss, actions, isPending, isLocked } = useRestockActions()
  const focusRef = useFocusRescue<HTMLDivElement>(isPending)
  const { setDone, remove, addSuggestion, setGapStatus, unlist } = actions
  return (
    <RestockContext
      value={{ setDone, remove, addSuggestion, setGapStatus, showGap: unlist, isLocked }}
    >
      <div ref={focusRef}>
        {children}
        <NoticeAnnouncer announcement={restockAnnouncement(notice)} />
        {notice === null ? null : (
          <RestockNoticeBar notice={notice} actions={actions} onDismiss={dismiss} />
        )}
      </div>
    </RestockContext>
  )
}
