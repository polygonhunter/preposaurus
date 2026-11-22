'use client'
import { useActionState } from 'react'
import { DEFAULT_HOUSEHOLD_NAME } from '@/shared/config/constants'
import { Button } from '@/shared/ui/Button'
import { Field } from '@/shared/ui/Field'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { LiveMessage } from '@/shared/ui/LiveMessage'
import { setupAction, type SetupState } from '../actions/setup-action'

const INITIAL_STATE: SetupState = {
  errors: {},
  values: { username: '', householdName: DEFAULT_HOUSEHOLD_NAME },
}

const PASSWORD_HINT =
  'Mindestens 10 Zeichen. Ein Satz oder ein paar Wörter sind gut. Bitte keins, das du woanders nutzt.'

const firstError = (errors: SetupState['errors']) =>
  errors.username ?? errors.password ?? errors.passwordRepeat ?? errors.householdName

// Ersteinrichtung, Schritt „Willkommen und Konto“ (ONBOARDING O-02): erster Admin und Haushalt.
export function SetupForm() {
  const [state, formAction, isPending] = useActionState(setupAction, INITIAL_STATE)
  const { errors, values } = state
  return (
    <form action={formAction} className="pb-6">
      <GroupHeader id="konto">Konto</GroupHeader>
      <div role="group" aria-labelledby="konto" className="mx-4 flex flex-col gap-4 breit:mx-6">
        <Field
          label="Benutzername"
          name="benutzername"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          defaultValue={values.username}
          hint="Damit meldet ihr euch später an. Groß- und Kleinschreibung spielt keine Rolle."
          error={errors.username}
        />
        <Field
          label="Passwort"
          name="passwort"
          type="password"
          autoComplete="new-password"
          required
          hint={PASSWORD_HINT}
          error={errors.password}
        />
        <Field
          label="Passwort wiederholen"
          name="passwortWiederholen"
          type="password"
          autoComplete="new-password"
          required
          error={errors.passwordRepeat}
        />
      </div>
      <GroupHeader id="haushalt">Haushalt</GroupHeader>
      <div role="group" aria-labelledby="haushalt" className="mx-4 breit:mx-6">
        <Field
          label="Name des Haushalts"
          name="haushaltsname"
          autoComplete="off"
          required
          defaultValue={values.householdName}
          hint="Steht in der App und lässt sich später ändern."
          error={errors.householdName}
        />
      </div>
      <LiveMessage message={firstError(errors)} />
      <div className="mx-4 flex flex-col gap-3 pt-8 breit:mx-6">
        <Button type="submit" pendingLabel={isPending ? 'Richtet ein …' : undefined}>
          Einrichten
        </Button>
        <p className="px-4 text-footnote text-fg2">
          Mit diesem Konto verwaltet ihr Preposaurus. Weitere Personen legt ihr danach in den
          Einstellungen an.
        </p>
      </div>
    </form>
  )
}
