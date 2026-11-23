'use client'

import { useEffect, useState } from 'react'
import { useIsOnline } from '../hooks/use-is-online'
import { NoticeBar } from './NoticeBar'

/** Ruhige Meldung, wenn ohne Verbindung etwas gespeichert werden soll. */
export const OFFLINE_WRITE_MESSAGE =
  'Ohne Verbindung geht das gerade nicht. Sobald das NAS erreichbar ist, klappt es wieder.'

// Sperrt ohne Verbindung jedes Formular im App-Rahmen (M10-02, #82): Erfassen, Suchen, Einstellungen.
// Das Abfangen in der Capture-Phase am window kommt vor React an, die Server Action startet also
// gar nicht erst und nichts geht still verloren. Knöpfe ohne Formular (z. B. „−1“) sperren sich selbst.
export function OfflineWriteGuard() {
  const isOnline = useIsOnline()
  const [isBlocked, setBlocked] = useState(false)
  const [wasOnline, setWasOnline] = useState(isOnline)
  if (wasOnline !== isOnline) {
    setWasOnline(isOnline)
    setBlocked(false)
  }

  useEffect(() => {
    if (isOnline) return
    const block = (event: Event) => {
      event.preventDefault()
      event.stopPropagation()
      setBlocked(true)
    }
    window.addEventListener('submit', block, true)
    return () => {
      window.removeEventListener('submit', block, true)
    }
  }, [isOnline])

  if (!isBlocked) return null
  return (
    <NoticeBar
      message={OFFLINE_WRITE_MESSAGE}
      onDismiss={() => {
        setBlocked(false)
      }}
    />
  )
}
