/** Die eine Meldung unten auf einer Seite (Rückgängig-Zeile oder Fehler), wie sie angesagt wird. */
export type BarAnnouncement = Readonly<{
  // Neuer Schlüssel, neue Ansage, auch wenn der Text gleich bleibt
  key: string
  message: string
  // Ein Fehler kommt sofort (role="alert"), die Rückgängig-Zeile höflich (role="status")
  isError: boolean
}>

type NoticeAnnouncerProps = Readonly<{ announcement: BarAnnouncement | null }>

// Ein neuer Schlüssel tauscht den Text aus, damit auch derselbe Satz noch einmal angesagt wird
const liveText = (announcement: BarAnnouncement | null) =>
  announcement === null ? null : <span key={announcement.key}>{announcement.message}</span>

// Sagt die Leiste unten an (#274). Beide Bereiche sind immer da, auch leer (wie LiveMessage,
// CODE_PRINZIPIEN §12): Einen Live-Bereich, der erst mit seinem Text entsteht, melden Screenreader
// nicht zuverlässig. Die sichtbare Leiste (UndoBar, NoticeBar) hat keine Live-Rolle, sonst käme
// die Meldung doppelt. Der Fokus bleibt beim Erscheinen, wo er ist; die Ansage kommt nur von hier.
export function NoticeAnnouncer({ announcement }: NoticeAnnouncerProps) {
  const isError = announcement?.isError === true
  return (
    <>
      <p role="status" className="sr-only">
        {liveText(isError ? null : announcement)}
      </p>
      <p role="alert" className="sr-only">
        {liveText(isError ? announcement : null)}
      </p>
    </>
  )
}
