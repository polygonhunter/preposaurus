type LiveMessageProps = Readonly<{ message: string | null | undefined }>

// Sagt eine Meldung per Screenreader an, die sichtbar schon am Feld steht (CODE_PRINZIPIEN §12).
// Der Bereich ist immer da, auch leer: Nur so melden Screenreader eine neue Meldung zuverlässig.
export function LiveMessage({ message }: LiveMessageProps) {
  return (
    <p className="sr-only" aria-live="polite">
      {message ?? ''}
    </p>
  )
}
