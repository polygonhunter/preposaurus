'use client'
import { useActionState } from 'react'
import { ActionForm } from '@/shared/ui/ActionForm'
import { Button } from '@/shared/ui/Button'
import { Field } from '@/shared/ui/Field'
import { SaveStatus } from '@/shared/ui/SaveStatus'
import { NAME_FORM_IDLE, type NameFormState } from '../actions/catalog-form-state'

type NameFormProps = Readonly<{
  action: (previous: NameFormState, formData: FormData) => Promise<NameFormState>
  label: string
  submitLabel: string
  /** Beim Umbenennen: der Eintrag und sein bisheriger Name */
  entry?: Readonly<{ id: string; name: string }>
}>

// Ein Namensfeld mit Knopf, zum Anlegen und Umbenennen eigener Stammdaten (EIN-04). Der Fehler
// steht am Feld, der Fokus springt hin, die Eingabe bleibt.
export function NameForm({ action, label, submitLabel, entry }: NameFormProps) {
  const [state, formAction, isPending] = useActionState(action, NAME_FORM_IDLE)
  const name = state.status === 'idle' ? (entry?.name ?? '') : state.name
  return (
    <ActionForm
      result={state}
      announcement={state.fieldError}
      action={formAction}
      className="mx-4 flex flex-col gap-3 breit:mx-6"
    >
      {entry ? <input type="hidden" name="id" value={entry.id} /> : null}
      <Field
        label={label}
        name="name"
        required
        maxLength={40}
        autoComplete="off"
        defaultValue={name}
        error={state.fieldError ?? undefined}
      />
      <div className="flex items-center justify-between gap-3">
        <SaveStatus state={state} />
        <Button type="submit" variant="tinted" pendingLabel={isPending ? 'Speichert …' : undefined}>
          {submitLabel}
        </Button>
      </div>
    </ActionForm>
  )
}
