'use client'
import { useActionState } from 'react'
import { Button } from '@/shared/ui/Button'
import { GroupFooter } from '@/shared/ui/GroupFooter'
import { Toggle } from '@/shared/ui/Toggle'
import { SETTING_IDLE } from '../actions/action-messages'
import { saveStillGoodAction } from '../actions/save-still-good-action'
import { SaveStatus } from '@/shared/ui/SaveStatus'

type StillGoodFormProps = Readonly<{ isOn: boolean }>

// Schalter „Noch gut zählt mit“ (ROT-05, #117), Standard aus. Er wirkt nur auf „Heute versorgt“,
// fürs Zieldatum zählt eine abgelaufene Packung nie.
export function StillGoodForm({ isOn }: StillGoodFormProps) {
  const [state, formAction, isPending] = useActionState(saveStillGoodAction, SETTING_IDLE)
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="mx-4 rounded-group bg-surface px-4 breit:mx-6 breit:border breit:border-line">
        <Toggle label="„Noch gut“ zählt mit" name="noch-gut" value="an" defaultChecked={isOn} />
      </div>
      <GroupFooter>
        Abgelaufene Packungen, die ihr angeschaut und als „noch gut“ markiert habt, zählen dann zu
        „Heute versorgt“. Fürs Zieldatum zählen sie nie mit.
      </GroupFooter>
      <div className="mx-4 flex items-center justify-between gap-3 breit:mx-6">
        <SaveStatus state={state} />
        <Button type="submit" variant="tinted" pendingLabel={isPending ? 'Speichert …' : undefined}>
          Speichern
        </Button>
      </div>
    </form>
  )
}
