'use client'
import { useActionState, useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { FormSubmit } from '@/shared/ui/FormSubmit'
import { Sheet } from '@/shared/ui/Sheet'
import { REMOVE_IDLE, type RemoveState } from '../actions/catalog-form-state'

type RemoveEntryButtonProps = Readonly<{
  id: string
  name: string
  action: (previous: RemoveState, formData: FormData) => Promise<RemoveState>
  /** Knopf, z. B. „Lagerort löschen“ */
  label: string
}>

// Löschen eines unbenutzten eigenen Eintrags mit kurzer Rückfrage im Blatt (EIN-04).
export function RemoveEntryButton({ id, name, action, label }: RemoveEntryButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(action, REMOVE_IDLE)
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
        {label}
      </Button>
      <Sheet isOpen={isOpen} onClose={close} title={`„${name}“ löschen?`}>
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={id} />
          <p className="text-callout text-fg2">Das lässt sich nicht rückgängig machen.</p>
          {state.message ? (
            <p role="alert" className="text-footnote text-red">
              {state.message}
            </p>
          ) : null}
          <FormSubmit
            label="Löschen"
            isPending={isPending}
            pendingLabel="Löscht …"
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
