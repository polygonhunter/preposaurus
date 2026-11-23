'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useFocusFirstInvalid } from '@/shared/hooks/use-focus-first-invalid'
import { Button } from '@/shared/ui/Button'
import { Field } from '@/shared/ui/Field'
import { LiveMessage } from '@/shared/ui/LiveMessage'
import { addRestockItemAction, type AddRestockItemState } from '../actions/add-restock-item-action'
import { RESTOCK_LABEL_MAX_LENGTH } from '../schemas'

const INITIAL_STATE: AddRestockItemState = { error: null, added: 0 }

// „Eintrag ergänzen“ (NK-03): nur ein Name, keine Menge, keine Einkaufslisten-App (03 §5). Nach
// dem Speichern leert sich das Feld (neuer key) und bekommt den Fokus für den nächsten Eintrag.
// Sonst fiele er auf body: Das alte Feld ist weg, der Knopf beim Speichern gesperrt (#269).
export function AddItemForm() {
  const [state, formAction, isPending] = useActionState(addRestockItemAction, INITIAL_STATE)
  const formRef = useFocusFirstInvalid(state)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (state.added > 0) inputRef.current?.focus()
  }, [state.added])
  return (
    <form ref={formRef} action={formAction} className="mx-4 flex flex-col gap-3 pt-6 breit:mx-6">
      <Field
        key={state.added}
        ref={inputRef}
        label="Eintrag ergänzen"
        name="eintrag"
        placeholder="zum Beispiel Knäckebrot"
        maxLength={RESTOCK_LABEL_MAX_LENGTH}
        autoComplete="off"
        required
        error={state.error ?? undefined}
      />
      <LiveMessage message={state.error} />
      <div className="flex justify-end">
        <Button type="submit" variant="tinted" pendingLabel={isPending ? 'Speichert …' : undefined}>
          Hinzufügen
        </Button>
      </div>
    </form>
  )
}
