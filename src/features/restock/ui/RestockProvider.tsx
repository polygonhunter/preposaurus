'use client'

import type { ReactNode } from 'react'
import { RestockContext } from './restock-context'
import { RestockNoticeBar } from './RestockNoticeBar'
import { useRestockActions } from './use-restock-actions'

type RestockProviderProps = Readonly<{ children: ReactNode }>

// Stellt den Zeilen Abhaken, Entfernen und „Auf die Liste“ bereit und zeigt die eine Meldung unten
// (Rückgängig-Zeile oder Fehler). Nach jeder Änderung lädt die Liste neu (refresh in der Action).
export function RestockProvider({ children }: RestockProviderProps) {
  const { notice, dismiss, actions, isLocked } = useRestockActions()
  const { setDone, remove, addSuggestion } = actions
  return (
    <RestockContext value={{ setDone, remove, addSuggestion, isLocked }}>
      {children}
      {notice === null ? null : (
        <RestockNoticeBar notice={notice} actions={actions} onDismiss={dismiss} />
      )}
    </RestockContext>
  )
}
