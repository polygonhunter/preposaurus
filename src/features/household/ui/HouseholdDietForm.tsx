'use client'
import { useActionState } from 'react'
import { Button } from '@/shared/ui/Button'
import { Segmented } from '@/shared/ui/Segmented'
import { SETTING_IDLE } from '../actions/action-messages'
import { saveHouseholdDietAction } from '../actions/save-household-rules-action'
import type { Diet } from '../domain/member'
import { DIET_LABELS, optionsOf } from './member-labels'
import { SaveStatus } from '@/shared/ui/SaveStatus'

type HouseholdDietFormProps = Readonly<{ diet: Diet }>

// Standard-Ernährungsform des Haushalts (HH-03). Sie gilt für jede Person mit „Wie Haushalt“.
export function HouseholdDietForm({ diet }: HouseholdDietFormProps) {
  const [state, formAction, isPending] = useActionState(saveHouseholdDietAction, SETTING_IDLE)
  return (
    <form action={formAction} className="mx-4 flex flex-col gap-3 breit:mx-6">
      <Segmented
        legend="Ernährungsform des Haushalts"
        name="ernaehrungsform"
        options={optionsOf(DIET_LABELS)}
        defaultValue={diet}
      />
      <div className="flex items-center justify-between gap-3">
        <SaveStatus state={state} />
        <Button type="submit" variant="tinted" pendingLabel={isPending ? 'Speichert …' : undefined}>
          Speichern
        </Button>
      </div>
    </form>
  )
}
