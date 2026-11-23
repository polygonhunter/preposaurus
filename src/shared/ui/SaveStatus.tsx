type SaveState = Readonly<{ status: 'idle' | 'saved' | 'error'; message: string | null }>

type SaveStatusProps = Readonly<{ state: SaveState }>

// Rückmeldung nach dem Speichern einer Einstellung: sichtbar und per Screenreader angesagt.
export function SaveStatus({ state }: SaveStatusProps) {
  return (
    <p
      aria-live="polite"
      className={
        state.status === 'error' ? 'px-4 text-footnote text-red' : 'px-4 text-footnote text-green'
      }
    >
      {state.message ?? ''}
    </p>
  )
}
