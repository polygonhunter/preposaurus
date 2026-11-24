'use client'
import { useActionState } from 'react'
import { ActionForm } from '@/shared/ui/ActionForm'
import { GroupFooter } from '@/shared/ui/GroupFooter'
import { Toggle } from '@/shared/ui/Toggle'
import { SETTING_IDLE } from '../actions/action-messages'
import { saveStillGoodAction } from '../actions/save-still-good-action'

type StillGoodFormProps = Readonly<{
  isOn: boolean
  // id des Gruppenkopfs: Das Formular heißt so, die Seite hat mehrere „Speichern“
  labelledBy: string
}>

// Schalter „Noch gut zählt mit“ (ROT-05, #117), Standard aus. Er wirkt nur auf „Heute versorgt“,
// fürs Zieldatum zählt eine abgelaufene Packung nie.
export function StillGoodForm({ isOn, labelledBy }: StillGoodFormProps) {
  const [state, formAction, isPending] = useActionState(saveStillGoodAction, SETTING_IDLE)
  return (
    <ActionForm
      action={formAction}
      result={state}
      announcement={null}
      submit={{ label: 'Speichern', isPending, status: state, isInset: true }}
      aria-labelledby={labelledBy}
      className="flex flex-col gap-3"
    >
      <div className="mx-4 rounded-group bg-surface px-4 breit:mx-6 breit:border breit:border-line">
        <Toggle label="„Noch gut“ zählt mit" name="noch-gut" value="an" defaultChecked={isOn} />
      </div>
      <GroupFooter>
        Abgelaufene Packungen, die ihr angeschaut und als „noch gut“ markiert habt, zählen dann zu
        „Heute versorgt“. Fürs Zieldatum zählen sie nie mit.
      </GroupFooter>
    </ActionForm>
  )
}
