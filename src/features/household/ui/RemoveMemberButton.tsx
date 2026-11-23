'use client'
import { useActionState, useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { Sheet } from '@/shared/ui/Sheet'
import { SETTING_IDLE } from '../actions/action-messages'
import { removeMemberAction } from '../actions/remove-member-action'

type RemoveMemberButtonProps = Readonly<{ memberId: string; name: string }>

// Entfernen mit kurzer Rückfrage im Blatt (#38). Der Vorrat bleibt, nur die Person zählt nicht mehr mit.
export function RemoveMemberButton({ memberId, name }: RemoveMemberButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(removeMemberAction, SETTING_IDLE)
  return (
    <div className="mx-4 flex flex-col items-start pt-6 breit:mx-6">
      <Button
        variant="destructive"
        onClick={() => {
          setIsOpen(true)
        }}
      >
        Person entfernen
      </Button>
      <Sheet
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false)
        }}
        title={`${name} entfernen?`}
      >
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={memberId} />
          <p className="text-callout text-fg2">
            {name} zählt dann nicht mehr zum Bedarf. Der Vorrat und ein Login bleiben, wie sie sind.
          </p>
          {state.message ? (
            <p role="alert" className="text-footnote text-red">
              {state.message}
            </p>
          ) : null}
          <Button type="submit" pendingLabel={isPending ? 'Entfernt …' : undefined}>
            Entfernen
          </Button>
          <Button
            variant="plain"
            onClick={() => {
              setIsOpen(false)
            }}
          >
            Abbrechen
          </Button>
        </form>
      </Sheet>
    </div>
  )
}
