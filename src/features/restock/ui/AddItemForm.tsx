'use client'

import { useActionState, useEffect, useRef } from 'react'
import { isFocusLost } from '@/shared/hooks/focus-targets'
import { ActionForm } from '@/shared/ui/ActionForm'
import { Field } from '@/shared/ui/Field'
import { addRestockItemAction, type AddRestockItemState } from '../actions/add-restock-item-action'
import { RESTOCK_LABEL_MAX_LENGTH } from '../schemas'

const INITIAL_STATE: AddRestockItemState = { error: null, added: 0 }

// „Eintrag ergänzen“ (NK-03): nur ein Name, keine Menge, keine Einkaufslisten-App (03 §5). Nach
// dem Speichern leert sich das Feld (neuer key) und bekommt den Fokus für den nächsten Eintrag.
// Sonst fiele er auf body: Das alte Feld ist weg, der Knopf beim Speichern gesperrt (#269). Wer
// inzwischen woanders weitergemacht hat, behält seinen Fokus.
export function AddItemForm() {
  const [state, formAction, isPending] = useActionState(addRestockItemAction, INITIAL_STATE)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (state.added > 0 && isFocusLost()) inputRef.current?.focus()
  }, [state.added])
  return (
    <ActionForm
      result={state}
      announcement={state.error}
      action={formAction}
      submit={{ label: 'Hinzufügen', isPending }}
      className="mx-4 flex flex-col gap-3 pt-6 breit:mx-6"
    >
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
    </ActionForm>
  )
}
