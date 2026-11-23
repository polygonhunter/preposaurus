'use client'
import { useActionState } from 'react'
import { Button } from '@/shared/ui/Button'
import { SaveStatus } from '@/shared/ui/SaveStatus'
import { AI_ACTION_IDLE } from '../actions/ai-action-state'
import { testAiConnectionAction } from '../actions/test-ai-connection-action'

type TestConnectionButtonProps = Readonly<{
  /** ID der Verbindung oder „env“ für die Verbindung aus der Umgebung */
  target: string
}>

// „Verbindung testen“ (#108): ein kleiner Aufruf ohne Foto, darunter ein ruhiger Satz zum Ergebnis.
// Welche Verbindung gemeint ist, sagt der Abschnitt, in dem der Knopf steht.
export function TestConnectionButton({ target }: TestConnectionButtonProps) {
  const [state, formAction, isPending] = useActionState(testAiConnectionAction, AI_ACTION_IDLE)
  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <input type="hidden" name="ziel" value={target} />
      <Button type="submit" variant="tinted" pendingLabel={isPending ? 'Testet …' : undefined}>
        Verbindung testen
      </Button>
      <SaveStatus state={state} />
    </form>
  )
}
