'use client'
import { useActionState } from 'react'
import { Button } from '@/shared/ui/Button'
import { Field } from '@/shared/ui/Field'
import { LiveMessage } from '@/shared/ui/LiveMessage'
import { Toggle } from '@/shared/ui/Toggle'
import { signInAction, type SignInState } from '../actions/sign-in-action'

type SignInFormProps = Readonly<{
  // Geprüfter Pfad, auf den es nach der Anmeldung zurückgeht
  returnTo: string
}>

const INITIAL_STATE: SignInState = { message: null, username: '' }

// Anmelden (ONBOARDING O-08). Die Meldung steht am Passwort, verrät aber nicht, welches Feld
// falsch war (EINSTELLUNGEN §4.3).
export function SignInForm({ returnTo }: SignInFormProps) {
  const [state, formAction, isPending] = useActionState(signInAction, INITIAL_STATE)
  return (
    <form action={formAction} className="mx-4 flex flex-col gap-4 pt-6 breit:mx-6">
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
      />
      <Field
        label="Passwort"
        name="passwort"
        type="password"
        autoComplete="current-password"
        required
        error={state.message ?? undefined}
      />
      <div className="rounded-group bg-surface px-4">
        <Toggle label="Angemeldet bleiben" name="angemeldetBleiben" defaultChecked />
      </div>
      <LiveMessage message={state.message} />
      <Button type="submit" pendingLabel={isPending ? 'Meldet an …' : undefined}>
        Anmelden
      </Button>
      <p className="px-4 text-footnote text-fg2">
        Passwort vergessen? Ein Admin kann es zurücksetzen.
      </p>
    </form>
  )
}
