'use client'

import { useIsOnline } from '../hooks/use-is-online'

type OfflineNoticeProps = Readonly<{
  // Zeitpunkt, zu dem der Server die Seite gerendert hat (ISO). Liegt die Seite im Cache des
  // Service Workers, ist das der Stand, den man sieht.
  loadedAt: string
}>

const formatter = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' })

// Ruhiger Hinweis auf Übersicht und Vorrat, wenn das NAS nicht erreichbar ist (M10-02, #82).
// Der Bereich ist immer da, damit Screenreader den Wechsel ansagen (wie LiveMessage).
export function OfflineNotice({ loadedAt }: OfflineNoticeProps) {
  const isOnline = useIsOnline()
  return (
    <div role="status">
      {isOnline ? null : (
        <div className="mx-4 mb-4 rounded-group bg-surface px-4 py-3 breit:mx-6 breit:border breit:border-line">
          <p className="text-headline">
            Ohne Verbindung – Stand von {formatter.format(new Date(loadedAt))}
          </p>
          <p className="pt-1 text-footnote text-fg2">
            Erfassen und Entnehmen gehen wieder, sobald das NAS erreichbar ist.
          </p>
        </div>
      )}
    </div>
  )
}
