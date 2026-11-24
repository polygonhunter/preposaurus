'use client'
import { useActionState, useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { FormSubmit } from '@/shared/ui/FormSubmit'
import { Sheet } from '@/shared/ui/Sheet'
import { setUserActiveAction } from '../actions/set-user-active-action'
import { USER_ACTION_IDLE } from '../actions/user-action-messages'

type DeactivateUserButtonProps = Readonly<{ userId: string; name: string }>

// Deaktivieren mit kurzer Rückfrage (EINSTELLUNGEN_NUTZER §3.1). Löschen gibt es nicht.
export function DeactivateUserButton({ userId, name }: DeactivateUserButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(setUserActiveAction, USER_ACTION_IDLE)
  const close = () => {
    setIsOpen(false)
  }
  return (
    <div className="mx-4 flex flex-col items-start breit:mx-6">
      <Button
        variant="destructive"
        onClick={() => {
          setIsOpen(true)
        }}
      >
        Deaktivieren
      </Button>
      {state.status === 'error' ? <p className="text-footnote text-red">{state.message}</p> : null}
      <Sheet isOpen={isOpen} onClose={close} title={`${name} deaktivieren?`}>
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={userId} />
          <input type="hidden" name="aktiv" value="nein" />
          <p className="text-callout text-fg2">
            {name} wird auf allen Geräten abgemeldet und kann sich nicht mehr anmelden. Was {name}{' '}
            erfasst hat, bleibt. Ihr könnt das Konto später wieder aktivieren.
          </p>
          {state.status === 'error' ? (
            <p role="alert" className="text-footnote text-red">
              {state.message}
            </p>
          ) : null}
          <FormSubmit
            label="Deaktivieren"
            isPending={isPending}
            pendingLabel="Deaktiviert …"
            after={
              <Button variant="plain" onClick={close}>
                Abbrechen
              </Button>
            }
          />
        </form>
      </Sheet>
    </div>
  )
}
