'use client'
import { useActionState } from 'react'
import { ActionForm } from '@/shared/ui/ActionForm'
import { GroupFooter } from '@/shared/ui/GroupFooter'
import { Toggle } from '@/shared/ui/Toggle'
import { PROFILE_ACTION_IDLE } from '../actions/profile-action-state'
import { saveShortcutsAction } from '../actions/save-shortcuts-action'

type ShortcutsFormProps = Readonly<{ isOn: boolean }>

// Schalter „Tastenkürzel“ (#254, WCAG 2.1.4): Ein-Zeichen-Kürzel stören bei Spracheingabe oder
// Tremor. Aus heißt: keine Kürzel, keine angezeigten Tasten.
export function ShortcutsForm({ isOn }: ShortcutsFormProps) {
  const [state, formAction, isPending] = useActionState(saveShortcutsAction, PROFILE_ACTION_IDLE)
  return (
    <ActionForm
      action={formAction}
      result={state}
      announcement={null}
      submit={{ label: 'Speichern', isPending, status: state, isInset: true }}
      className="flex flex-col gap-3"
    >
      <div className="mx-4 rounded-group bg-surface px-4 breit:mx-6 breit:border breit:border-line">
        <Toggle label="Tastenkürzel" name="kuerzel" value="an" defaultChecked={isOn} />
      </div>
      <GroupFooter>
        Mit Tastatur springt „/“ in die Suche und „n“ öffnet Erfassen. Die Wahl gilt für diesen
        Browser.
      </GroupFooter>
    </ActionForm>
  )
}
