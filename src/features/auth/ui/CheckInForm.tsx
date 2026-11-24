'use client'
import { useActionState } from 'react'
import { ActionForm } from '@/shared/ui/ActionForm'
import { Segmented } from '@/shared/ui/Segmented'
import { PROFILE_ACTION_IDLE } from '../actions/profile-action-state'
import { saveCheckInAction } from '../actions/save-check-in-action'

const OPTIONS = [
  { value: 'aus', label: 'Aus' },
  { value: 'woechentlich', label: 'Wöchentlich' },
  { value: 'monatlich', label: 'Monatlich' },
]

type CheckInFormProps = Readonly<{ cadence: string | null }>

// Check-in-Mail für sich selbst (ERI-06, #89). Die Seite zeigt das Formular nur, wenn Mailversand
// und eigene Adresse da sind, sonst einen ruhigen Satz.
export function CheckInForm({ cadence }: CheckInFormProps) {
  const [state, formAction, isPending] = useActionState(saveCheckInAction, PROFILE_ACTION_IDLE)
  return (
    <ActionForm
      action={formAction}
      result={state}
      announcement={null}
      submit={{ label: 'Speichern', isPending, status: state }}
      className="mx-4 flex flex-col gap-3 breit:mx-6"
    >
      <Segmented
        legend="Check-in-Mail"
        name="checkin"
        options={OPTIONS}
        defaultValue={cadence ?? 'aus'}
        isLegendVisible
      />
    </ActionForm>
  )
}
