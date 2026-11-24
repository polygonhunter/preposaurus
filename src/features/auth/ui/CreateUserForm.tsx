'use client'
import { useActionState, useState } from 'react'
import { USERS_PATH } from '@/shared/config/settings-paths'
import { ActionForm } from '@/shared/ui/ActionForm'
import { Button } from '@/shared/ui/Button'
import { ButtonLink } from '@/shared/ui/ButtonLink'
import { Field } from '@/shared/ui/Field'
import { PasswordField } from '@/shared/ui/PasswordField'
import { Segmented } from '@/shared/ui/Segmented'
import { createUserAction, type CreateUserState } from '../actions/create-user-action'
import { MemberChoice, type MemberOption } from './MemberChoice'
import { PasswordReveal } from './PasswordReveal'
import { suggestUsername } from './suggest-username'
import { ROLE_OPTIONS } from './user-format'

type CreateUserFormProps = Readonly<{ members: readonly MemberOption[] }>

const INITIAL: CreateUserState = { errors: {}, message: null, values: null, created: null }

const EMPTY_VALUES = { displayName: '', username: '', role: 'mitglied', memberId: '' }

const firstError = ({ errors, message }: CreateUserState) =>
  errors.displayName ??
  errors.username ??
  errors.role ??
  errors.memberId ??
  errors.password ??
  message

// Nutzer anlegen (#123). Nach dem Speichern steht statt des Formulars das Passwort, genau einmal.
export function CreateUserForm({ members }: CreateUserFormProps) {
  const [state, formAction, isPending] = useActionState(createUserAction, INITIAL)
  const values = state.values ?? EMPTY_VALUES
  const [displayName, setDisplayName] = useState(values.displayName)
  const [ownUsername, setOwnUsername] = useState<string | null>(values.username || null)
  if (state.created !== null) {
    return (
      <div className="flex flex-col gap-4 pt-6">
        <PasswordReveal {...state.created} />
        <div className="mx-4 breit:mx-6">
          <ButtonLink href={USERS_PATH}>Weitergegeben</ButtonLink>
        </div>
      </div>
    )
  }
  const { errors } = state
  return (
    <ActionForm
      result={state}
      announcement={firstError(state)}
      action={formAction}
      className="mx-4 flex flex-col gap-4 pt-6 breit:mx-6"
    >
      <Field
        label="Anzeigename"
        name="anzeigename"
        required
        value={displayName}
        onChange={(event) => {
          setDisplayName(event.target.value)
        }}
        error={errors.displayName}
      />
      <Field
        label="Benutzername"
        name="benutzername"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        required
        value={ownUsername ?? suggestUsername(displayName)}
        onChange={(event) => {
          setOwnUsername(event.target.value)
        }}
        hint="Damit meldet sich die Person an."
        error={errors.username}
      />
      <Segmented
        legend="Rolle"
        name="rolle"
        options={ROLE_OPTIONS}
        defaultValue={values.role}
        isLegendVisible
      />
      <MemberChoice members={members} defaultValue={values.memberId} error={errors.memberId} />
      <PasswordField
        label="Passwort (freiwillig)"
        name="passwort"
        autoComplete="new-password"
        hint="Leer lassen, dann erzeugt Preposaurus eins. Mindestens 10 Zeichen."
        error={errors.password}
      />
      {state.message ? <p className="px-4 text-footnote text-red">{state.message}</p> : null}
      <Button type="submit" pendingLabel={isPending ? 'Legt an …' : undefined}>
        Anlegen
      </Button>
    </ActionForm>
  )
}
