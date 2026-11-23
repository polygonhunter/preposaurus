'use client'
import { useActionState } from 'react'
import { Button } from '@/shared/ui/Button'
import { GroupFooter } from '@/shared/ui/GroupFooter'
import { SaveStatus } from '@/shared/ui/SaveStatus'
import { Toggle } from '@/shared/ui/Toggle'
import { PROFILE_ACTION_IDLE } from '../actions/profile-action-state'
import { saveShortcutsAction } from '../actions/save-shortcuts-action'

type ShortcutsFormProps = Readonly<{ isOn: boolean }>

// Schalter „Tastenkürzel“ (#254, WCAG 2.1.4): Ein-Zeichen-Kürzel stören bei Spracheingabe oder
// Tremor. Aus heißt: keine Kürzel, keine angezeigten Tasten.
export function ShortcutsForm({ isOn }: ShortcutsFormProps) {
  const [state, formAction, isPending] = useActionState(saveShortcutsAction, PROFILE_ACTION_IDLE)
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="mx-4 rounded-group bg-surface px-4 breit:mx-6 breit:border breit:border-line">
        <Toggle label="Tastenkürzel" name="kuerzel" value="an" defaultChecked={isOn} />
      </div>
      <GroupFooter>
        Mit Tastatur springt „/“ in die Suche und „n“ öffnet Erfassen. Die Wahl gilt für diesen
        Browser.
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
