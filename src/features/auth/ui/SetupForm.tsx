'use client'
import { useActionState, useState } from 'react'
import { ActionForm } from '@/shared/ui/ActionForm'
import { Button } from '@/shared/ui/Button'
import { Field } from '@/shared/ui/Field'
import { PasswordField } from '@/shared/ui/PasswordField'
import { setupAction, type SetupState } from '../actions/setup-action'
import { suggestUsername } from './suggest-username'

const INITIAL_STATE: SetupState = { errors: {} }

const PASSWORD_HINT =
  'Mindestens 10 Zeichen. Ein Satz oder ein paar Wörter sind gut. Bitte keins, das du woanders nutzt.'

const firstError = (errors: SetupState['errors']) =>
  errors.displayName ?? errors.username ?? errors.password

// Bis jemand den Benutzernamen selbst ändert, folgt er dem Anzeigenamen (ONBOARDING §2.2).
function useSuggestedUsername() {
  const [displayName, setDisplayName] = useState('')
  const [ownUsername, setOwnUsername] = useState<string | null>(null)
  return {
    displayName,
    setDisplayName,
    username: ownUsername ?? suggestUsername(displayName),
    setUsername: setOwnUsername,
  }
}

// Ersteinrichtung, Schritt „Willkommen und Konto“ (ONBOARDING §2.2): Anzeigename, Benutzername und
// Passwort des ersten Admins. Die Felder sind gesteuert und bleiben nach einem Fehler stehen.
export function SetupForm() {
  const [{ errors }, formAction, isPending] = useActionState(setupAction, INITIAL_STATE)
  const { displayName, setDisplayName, username, setUsername } = useSuggestedUsername()
  return (
    <ActionForm
      result={errors}
      announcement={firstError(errors)}
      action={formAction}
      className="mx-4 flex flex-col gap-4 pt-6 pb-6 breit:mx-6"
    >
      <Field
        label="Anzeigename"
        name="anzeigename"
        autoComplete="name"
        required
        value={displayName}
        onChange={(event) => {
          setDisplayName(event.target.value)
        }}
        hint="So steht dein Name in der App, z. B. „Alex Beispiel“."
        error={errors.displayName}
      />
      <Field
        label="Benutzername"
        name="benutzername"
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        required
        value={username}
        onChange={(event) => {
          setUsername(event.target.value)
        }}
        hint="Damit meldest du dich an. Groß- und Kleinschreibung spielt keine Rolle."
        error={errors.username}
      />
      <PasswordField
        label="Passwort"
        name="passwort"
        autoComplete="new-password"
        required
        hint={PASSWORD_HINT}
        error={errors.password}
      />
      <div className="flex flex-col gap-3 pt-4">
        <Button type="submit" pendingLabel={isPending ? 'Legt an …' : undefined}>
          Weiter
        </Button>
        <p className="px-4 text-footnote text-fg2">
          Mit diesem Konto verwaltet ihr Preposaurus. Weitere Personen legt ihr danach in den
          Einstellungen an.
        </p>
      </div>
    </ActionForm>
  )
}
