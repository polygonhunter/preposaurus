'use client'
import { useActionState, useState } from 'react'
import { ActionForm } from '@/shared/ui/ActionForm'
import { Button } from '@/shared/ui/Button'
import { PasswordField } from '@/shared/ui/PasswordField'
import { SaveStatus } from '@/shared/ui/SaveStatus'
import { Sheet } from '@/shared/ui/Sheet'
import { AI_ACTION_IDLE } from '../actions/ai-action-state'
import { replaceAiKeyAction } from '../actions/replace-ai-key-action'

type ReplaceKeyButtonProps = Readonly<{ connectionId: string; name: string }>

// Schlüssel ersetzen (#108) im Blatt, z. B. nach einem neuen Schlüssel in der Konsole oder wenn sich
// APP_SECRET geändert hat. Das Feld ist nach dem Speichern wieder leer.
export function ReplaceKeyButton({ connectionId, name }: ReplaceKeyButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(replaceAiKeyAction, AI_ACTION_IDLE)
  const close = () => {
    setIsOpen(false)
  }
  return (
    <>
      <Button
        variant="tinted"
        onClick={() => {
          setIsOpen(true)
        }}
      >
        Schlüssel ersetzen
      </Button>
      <Sheet isOpen={isOpen} onClose={close} title={`Schlüssel für ${name} ersetzen`}>
        <ActionForm
          action={formAction}
          result={state}
          announcement={state.errors?.apiKey}
          className="flex flex-col gap-3"
        >
          <input type="hidden" name="id" value={connectionId} />
          <PasswordField
            label="Neuer API-Schlüssel"
            name="schluessel"
            error={state.errors?.apiKey}
            autoComplete="off"
            required
          />
          <SaveStatus state={state.errors?.apiKey === undefined ? state : AI_ACTION_IDLE} />
          <div className="flex flex-col gap-2">
            <Button type="submit" pendingLabel={isPending ? 'Speichert …' : undefined}>
              Ersetzen
            </Button>
            <Button variant="plain" onClick={close}>
              {state.status === 'saved' ? 'Fertig' : 'Abbrechen'}
            </Button>
          </div>
        </ActionForm>
      </Sheet>
    </>
  )
}
