'use client'
import { useActionState } from 'react'
import { useFocusFirstInvalid } from '@/shared/hooks/use-focus-first-invalid'
import { Button } from '@/shared/ui/Button'
import { Field } from '@/shared/ui/Field'
import { SaveStatus } from '@/shared/ui/SaveStatus'
import { PROFILE_ACTION_IDLE } from '../actions/profile-action-state'
import { saveProfileAction } from '../actions/save-profile-action'

type ProfileFormProps = Readonly<{ displayName: string; reminderEmail: string | null }>

// Anzeigename und freiwillige Adresse für Erinnerungen (#75). Leer heißt: keine Mails.
export function ProfileForm({ displayName, reminderEmail }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(saveProfileAction, PROFILE_ACTION_IDLE)
  const formRef = useFocusFirstInvalid(state)
  return (
    // noValidate: Fehler stehen ruhig am Feld statt in der Sprechblase des Browsers
    <form
      ref={formRef}
      action={formAction}
      noValidate
      className="mx-4 flex flex-col gap-4 breit:mx-6"
    >
      <Field
        label="Anzeigename"
        name="name"
        defaultValue={displayName}
        error={state.errors?.displayName}
        autoComplete="name"
        required
      />
      <Field
        label="E-Mail für Erinnerungen (freiwillig)"
        name="email"
        type="email"
        defaultValue={reminderEmail ?? ''}
        error={state.errors?.reminderEmail}
        hint="Nur für Wochenübersicht und Check-in-Mail. Leer lassen heißt: keine Mails. Zum Anmelden braucht es sie nicht."
        autoComplete="email"
        inputMode="email"
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
