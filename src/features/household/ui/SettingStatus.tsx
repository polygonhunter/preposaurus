import type { SettingState } from '../actions/action-messages'

type SettingStatusProps = Readonly<{ state: SettingState }>

// Rückmeldung nach dem Speichern einer Einstellung: sichtbar und per Screenreader angesagt.
export function SettingStatus({ state }: SettingStatusProps) {
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
