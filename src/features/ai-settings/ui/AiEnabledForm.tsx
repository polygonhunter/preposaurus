'use client'
import { useActionState } from 'react'
import { Button } from '@/shared/ui/Button'
import { GroupFooter } from '@/shared/ui/GroupFooter'
import { SaveStatus } from '@/shared/ui/SaveStatus'
import { Toggle } from '@/shared/ui/Toggle'
import { AI_ACTION_IDLE } from '../actions/ai-action-state'
import { saveAiEnabledAction } from '../actions/save-ai-enabled-action'

type AiEnabledFormProps = Readonly<{ isOn: boolean }>

// Haushaltsschalter der Foto-Erkennung (#79, EIN-06) mit dem Hinweis, wohin die Fotos gehen. Aus
// heißt: Erfassen geht nur von Hand, kein Foto erreicht den Anbieter.
export function AiEnabledForm({ isOn }: AiEnabledFormProps) {
  const [state, formAction, isPending] = useActionState(saveAiEnabledAction, AI_ACTION_IDLE)
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="mx-4 rounded-group bg-surface px-4 breit:mx-6 breit:border breit:border-line">
        <Toggle label="Foto-Erkennung" name="ki" value="an" defaultChecked={isOn} />
      </div>
      <GroupFooter>
        Fotos werden zur Erkennung an Anthropic (USA) gesendet. Ist sie aus, erfasst ihr alles von
        Hand.
      </GroupFooter>
      <div className="mx-4 flex items-center justify-between gap-3 breit:mx-6">
        <SaveStatus state={state} />
        <Button type="submit" variant="tinted" pendingLabel={isPending ? 'Speichert …' : undefined}>
          Speichern
        </Button>
      </div>
    </form>
  )
}
