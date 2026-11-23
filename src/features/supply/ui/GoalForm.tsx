'use client'
import { useActionState, useState } from 'react'
import { useFocusFirstInvalid } from '@/shared/hooks/use-focus-first-invalid'
import { Button } from '@/shared/ui/Button'
import { Field } from '@/shared/ui/Field'
import { LiveMessage } from '@/shared/ui/LiveMessage'
import { Segmented } from '@/shared/ui/Segmented'
import { saveGoalAction, type GoalFormState } from '../actions/save-goal-action'
import { CUSTOM_GOAL_CHOICE, type GoalFormPlace } from '../schemas'
import { GOAL_CHOICE_OPTIONS, formatGoalDays, type GoalFormValues } from './goal-format'

type GoalFormProps = Readonly<{
  initialValues: GoalFormValues
  defaultDays: number
  /** Im Schritt „Ziel“ der Einrichtung (#40) führt Speichern gleich zum nächsten Schritt */
  place: GoalFormPlace
}>

const SUBMIT_LABELS: Record<GoalFormPlace, string> = {
  einstellungen: 'Speichern',
  einrichtung: 'Weiter',
}

const INITIAL_STATE: GoalFormState = { status: 'idle', errors: {}, message: null, values: null }

// Zieldauer und Zieldatum (#39). Ein vergangenes Datum lehnt die Action mit einer freundlichen
// Bitte am Feld ab.
export function GoalForm({ initialValues, defaultDays, place }: GoalFormProps) {
  const [state, formAction, isPending] = useActionState(saveGoalAction, INITIAL_STATE)
  const values = state.values ?? initialValues
  const [choice, setChoice] = useState(values.choice)
  const formRef = useFocusFirstInvalid(state)
  const { errors } = state
  return (
    <form ref={formRef} action={formAction} className="mx-4 flex flex-col gap-4 breit:mx-6">
      <input type="hidden" name="ort" value={place} />
      <Segmented
        legend="Wie lange soll euer Vorrat reichen?"
        name="dauer"
        options={GOAL_CHOICE_OPTIONS}
        defaultValue={values.choice}
        onChange={setChoice}
        isLegendVisible
      />
      <p className="-mt-2 px-4 text-footnote text-fg2">
        Die Empfehlung nennt {formatGoalDays(defaultDays)}.
      </p>
      {choice === CUSTOM_GOAL_CHOICE ? (
        <Field
          label="Eigene Dauer in Tagen"
          name="eigene-tage"
          inputMode="numeric"
          required
          defaultValue={values.customDays}
          error={errors.customDays}
        />
      ) : null}
      <Field
        label="Bis wann? (freiwillig)"
        name="zieldatum"
        type="date"
        defaultValue={values.targetDate}
        hint="Ohne Datum zeigt Preposaurus nur, wie lange ihr heute versorgt seid."
        error={errors.targetDate}
      />
      <p aria-live="polite" className="px-4 text-footnote text-green">
        {state.status === 'saved' ? state.message : ''}
      </p>
      {state.status === 'error' && state.message ? (
        <p className="px-4 text-footnote text-red">{state.message}</p>
      ) : null}
      <LiveMessage message={errors.customDays ?? errors.targetDate ?? errors.choice} />
      <Button type="submit" pendingLabel={isPending ? 'Speichert …' : undefined}>
        {SUBMIT_LABELS[place]}
      </Button>
    </form>
  )
}
