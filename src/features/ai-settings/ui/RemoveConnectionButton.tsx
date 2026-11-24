'use client'
import { useActionState, useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { FormSubmit } from '@/shared/ui/FormSubmit'
import { Sheet } from '@/shared/ui/Sheet'
import { AI_ACTION_IDLE } from '../actions/ai-action-state'
import { removeAiConnectionAction } from '../actions/remove-ai-connection-action'

type RemoveConnectionButtonProps = Readonly<{ connectionId: string; name: string }>

// Verbindung entfernen (#108) mit kurzer Rückfrage im Blatt. Der Schlüssel ist danach gelöscht.
export function RemoveConnectionButton({ connectionId, name }: RemoveConnectionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(removeAiConnectionAction, AI_ACTION_IDLE)
  const close = () => {
    setIsOpen(false)
  }
  return (
    <>
      <Button
        variant="destructive"
        onClick={() => {
          setIsOpen(true)
        }}
      >
        Entfernen
      </Button>
      <Sheet isOpen={isOpen} onClose={close} title={`${name} entfernen?`}>
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={connectionId} />
          <p className="text-callout text-fg2">
            Der gespeicherte Schlüssel wird gelöscht. Rollen, die diese Verbindung nutzen, gehen an
            eine andere Verbindung oder sind danach nicht eingerichtet.
          </p>
          {state.status === 'error' ? (
            <p role="alert" className="text-footnote text-red">
              {state.message}
            </p>
          ) : null}
          <FormSubmit
            label="Entfernen"
            isPending={isPending}
            pendingLabel="Entfernt …"
            after={
              <Button variant="plain" onClick={close}>
                Abbrechen
              </Button>
            }
          />
        </form>
      </Sheet>
    </>
  )
}
