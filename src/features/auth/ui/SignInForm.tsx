'use client'
import { useActionState } from 'react'
import { ActionForm } from '@/shared/ui/ActionForm'
import { Field } from '@/shared/ui/Field'
import { Toggle } from '@/shared/ui/Toggle'
import { signInAction, type SignInState } from '../actions/sign-in-action'

const FORGOT_NOTE = (
  <p className="px-4 text-footnote text-fg2">Passwort vergessen? Ein Admin kann es zurücksetzen.</p>
)

type SignInFormProps = Readonly<{
  // Geprüfter Pfad, auf den es nach der Anmeldung zurückgeht
  returnTo: string
}>

const INITIAL_STATE: SignInState = { errors: {}, username: '' }

// Anmelden (ONBOARDING O-08). Die Meldung nach falschen Angaben steht am Passwort, verrät aber
// nicht, welches Feld falsch war (EINSTELLUNGEN §4.3). Ein leeres Feld steht an sich selbst.
export function SignInForm({ returnTo }: SignInFormProps) {
  const [state, formAction, isPending] = useActionState(signInAction, INITIAL_STATE)
  const { errors } = state
  return (
    <ActionForm
      action={formAction}
      result={state}
      announcement={errors.username ?? errors.password}
      submit={{ label: 'Anmelden', isPending, pendingLabel: 'Meldet an …', after: FORGOT_NOTE }}
      className="mx-4 flex flex-col gap-4 pt-6 breit:mx-6"
    >
      <input type="hidden" name="weiter" value={returnTo} />
      <Field
        label="Benutzername"
        name="benutzername"
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        required
        defaultValue={state.username}
        error={errors.username}
      />
      <Field
        label="Passwort"
        name="passwort"
        type="password"
        autoComplete="current-password"
        required
        error={errors.password}
      />
      <div className="rounded-group bg-surface px-4">
        <Toggle label="Angemeldet bleiben" name="angemeldetBleiben" defaultChecked />
      </div>
    </ActionForm>
  )
}
