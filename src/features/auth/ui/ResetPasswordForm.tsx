'use client'
import { useActionState } from 'react'
import { ActionForm } from '@/shared/ui/ActionForm'
import { PasswordField } from '@/shared/ui/PasswordField'
import {
  resetUserPasswordAction,
  type ResetPasswordState,
} from '../actions/reset-user-password-action'
import { PasswordReveal } from './PasswordReveal'

type ResetPasswordFormProps = Readonly<{ userId: string }>

const INITIAL: ResetPasswordState = { message: null, passwordError: null, revealed: null }

// Passwort zurücksetzen (#123): erzeugt oder eingegeben, danach genau einmal angezeigt.
export function ResetPasswordForm({ userId }: ResetPasswordFormProps) {
  const [state, formAction, isPending] = useActionState(resetUserPasswordAction, INITIAL)
  if (state.revealed !== null) return <PasswordReveal {...state.revealed} />
  return (
    <ActionForm
      action={formAction}
      result={state}
      announcement={state.passwordError}
      submit={{ label: 'Passwort zurücksetzen', isPending, pendingLabel: 'Setzt zurück …' }}
      className="mx-4 flex flex-col gap-3 breit:mx-6"
    >
      <input type="hidden" name="id" value={userId} />
      <PasswordField
        label="Neues Passwort (freiwillig)"
        name="passwort"
        autoComplete="new-password"
        hint="Leer lassen, dann erzeugt Preposaurus eins. Alle Geräte dieses Nutzers werden abgemeldet."
        error={state.passwordError ?? undefined}
      />
      {state.message ? (
        <p role="alert" className="px-4 text-footnote text-red">
          {state.message}
        </p>
      ) : null}
    </ActionForm>
  )
}
