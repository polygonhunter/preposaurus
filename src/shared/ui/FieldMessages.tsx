type FieldMessagesProps = Readonly<{
  ids: Readonly<Record<'hintId' | 'noticeId' | 'errorId', string>>
  hint?: string | undefined
  // Ruhiger Hinweis „bitte prüfen“ (#295): übergeben heißt Live-Bereich, null heißt leer
  notice?: string | null | undefined
  error?: string | undefined
}>

// Unter dem Feld: Hinweis, „bitte prüfen“ und Fehler, je mit der ID für aria-describedby.
export function FieldMessages({ ids, hint, notice, error }: FieldMessagesProps) {
  return (
    <>
      {hint ? (
        <p id={ids.hintId} className="px-4 text-footnote text-fg2">
          {hint}
        </p>
      ) : null}
      {notice === undefined ? null : (
        <p id={ids.noticeId} role="status" className="px-4 text-footnote text-fg empty:hidden">
          {notice}
        </p>
      )}
      {error ? (
        <p id={ids.errorId} className="px-4 text-footnote text-red">
          {error}
        </p>
      ) : null}
    </>
  )
}
