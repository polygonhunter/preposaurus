'use client'
import { useActionState, useState } from 'react'
import { useFocusFirstInvalid } from '@/shared/hooks/use-focus-first-invalid'
import { Button } from '@/shared/ui/Button'
import { Field } from '@/shared/ui/Field'
import { LiveMessage } from '@/shared/ui/LiveMessage'
import { RadioChips } from '@/shared/ui/RadioChips'
import { Segmented } from '@/shared/ui/Segmented'
import { saveMemberAction, type MemberFormState } from '../actions/save-member-action'
import { DIET_LABELS, MEMBER_TYPE_LABELS, optionsOf } from './member-labels'
import type { MemberFormValues } from './member-form-values'
import { MemberMoreFields } from './MemberMoreFields'

type MemberFormProps = Readonly<{
  memberId: string | null
  initialValues: MemberFormValues
  /** „Alles“, „Vegetarisch“ … für die Wahl „Wie Haushalt“ */
  householdDietLabel: string
}>

const INITIAL_STATE: MemberFormState = { errors: {}, message: null, values: null }

const firstError = ({ errors, message }: MemberFormState) =>
  errors.name ?? errors.type ?? errors.birthYear ?? errors.birthMonth ?? message

// Person anlegen oder bearbeiten (#38). Pflicht sind Name, Typ und Geburtsjahr, bei Babys der
// Monat. Die übrigen Angaben aus HH-02 stehen eingeklappt darunter.
export function MemberForm({ memberId, initialValues, householdDietLabel }: MemberFormProps) {
  const [state, formAction, isPending] = useActionState(saveMemberAction, INITIAL_STATE)
  const values = state.values ?? initialValues
  const [type, setType] = useState(values.type)
  const formRef = useFocusFirstInvalid(state)
  const { errors } = state
  const dietOptions = [{ value: '', label: 'Wie Haushalt' }, ...optionsOf(DIET_LABELS)]
  return (
    <form ref={formRef} action={formAction} className="mx-4 flex flex-col gap-4 pt-6 breit:mx-6">
      <input type="hidden" name="id" value={memberId ?? ''} />
      <Field label="Name" name="name" required defaultValue={values.name} error={errors.name} />
      <RadioChips
        legend="Wer ist das?"
        name="typ"
        options={optionsOf(MEMBER_TYPE_LABELS)}
        defaultValue={values.type}
        onChange={setType}
        error={errors.type}
      />
      <Field
        label="Geburtsjahr"
        name="geburtsjahr"
        inputMode="numeric"
        required
        defaultValue={values.birthYear}
        hint="So rechnet sich das Alter von selbst weiter."
        error={errors.birthYear}
      />
      {type === 'baby' ? (
        <Field
          label="Geburtsmonat"
          name="geburtsmonat"
          inputMode="numeric"
          defaultValue={values.birthMonth}
          hint="Als Zahl, z. B. 3 für März."
          error={errors.birthMonth}
        />
      ) : null}
      <Segmented
        legend="Ernährungsform"
        name="ernaehrungsform"
        options={dietOptions}
        defaultValue={values.diet}
        isLegendVisible
      />
      <p className="-mt-2 px-4 text-footnote text-fg2">
        „Wie Haushalt“ heißt zurzeit: {householdDietLabel}.
      </p>
      <MemberMoreFields values={values} errors={errors} />
      {state.message ? <p className="px-4 text-footnote text-red">{state.message}</p> : null}
      <LiveMessage message={firstError(state)} />
      <div className="pt-2">
        <Button type="submit" pendingLabel={isPending ? 'Speichert …' : undefined}>
          Speichern
        </Button>
      </div>
    </form>
  )
}
