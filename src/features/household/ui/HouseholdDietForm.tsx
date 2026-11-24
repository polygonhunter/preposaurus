'use client'
import { useActionState } from 'react'
import { ActionForm } from '@/shared/ui/ActionForm'
import { Segmented } from '@/shared/ui/Segmented'
import { SETTING_IDLE } from '../actions/action-messages'
import { saveHouseholdDietAction } from '../actions/save-household-diet-action'
import type { Diet } from '../domain/member'
import { DIET_LABELS, optionsOf } from './member-labels'

type HouseholdDietFormProps = Readonly<{ diet: Diet }>

// Standard-Ernährungsform des Haushalts (HH-03). Sie gilt für jede Person mit „Wie Haushalt“.
export function HouseholdDietForm({ diet }: HouseholdDietFormProps) {
  const [state, formAction, isPending] = useActionState(saveHouseholdDietAction, SETTING_IDLE)
  return (
    <ActionForm
      action={formAction}
      result={state}
      announcement={null}
      submit={{ label: 'Speichern', isPending, status: state }}
      className="mx-4 flex flex-col gap-3 breit:mx-6"
    >
      <Segmented
        legend="Ernährungsform des Haushalts"
        name="ernaehrungsform"
        options={optionsOf(DIET_LABELS)}
        defaultValue={diet}
      />
    </ActionForm>
  )
}
