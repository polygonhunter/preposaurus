'use client'

import { useEffect, useState } from 'react'
import { useIsOnline } from '../hooks/use-is-online'
import { NoticeAnnouncer, type BarAnnouncement } from './NoticeAnnouncer'
import { NoticeBar } from './NoticeBar'

/** Ruhige Meldung, wenn ohne Verbindung etwas gespeichert werden soll. */
export const OFFLINE_WRITE_MESSAGE =
  'Ohne Verbindung geht das gerade nicht. Sobald das NAS erreichbar ist, klappt es wieder.'

const BLOCKED_ANNOUNCEMENT: BarAnnouncement = {
  key: 'offline',
  message: OFFLINE_WRITE_MESSAGE,
  isError: true,
}

// Sperrt ohne Verbindung jedes Formular im App-Rahmen (M10-02, #82): Erfassen, Suchen, Einstellungen.
// Das Abfangen in der Capture-Phase am window kommt vor React an, die Server Action startet also
// gar nicht erst und nichts geht still verloren. Knöpfe ohne Formular (z. B. „−1“) sperren sich selbst.
// Die Ansage steht immer im DOM, auch ohne Meldung (#274).
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

  return (
    <>
      <NoticeAnnouncer announcement={isBlocked ? BLOCKED_ANNOUNCEMENT : null} />
      {isBlocked ? (
        <NoticeBar
          message={OFFLINE_WRITE_MESSAGE}
          onDismiss={() => {
            setBlocked(false)
          }}
        />
      ) : null}
    </>
  )
}
