'use client'
import { useActionState } from 'react'
import { ActionForm } from '@/shared/ui/ActionForm'
import { PasswordField } from '@/shared/ui/PasswordField'
import { Toggle } from '@/shared/ui/Toggle'
import { changeOwnPasswordAction } from '../actions/change-own-password-action'
import { PROFILE_ACTION_IDLE } from '../actions/profile-action-state'

const PASSWORD_HINT =
  'Mindestens 10 Zeichen. Ein Satz oder ein paar Wörter sind gut. Bitte keins, das du woanders nutzt.'

// Eigenes Passwort ändern (EINSTELLUNGEN_NUTZER §3.2, §4.4). Das alte Passwort ist Pflicht, das
// Abmelden der anderen Geräte vorgewählt. Nach dem Absenden sind beide Felder wieder leer.
export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(
    changeOwnPasswordAction,
    PROFILE_ACTION_IDLE,
  )
  return (
    <ActionForm
      result={state}
      announcement={state.errors?.currentPassword ?? state.errors?.newPassword}
      action={formAction}
      submit={{ label: 'Passwort ändern', isPending, pendingLabel: 'Ändert …', status: state }}
      className="mx-4 flex flex-col gap-4 breit:mx-6"
    >
      <PasswordField
        label="Bisheriges Passwort"
        name="altes-passwort"
        error={state.errors?.currentPassword}
        autoComplete="current-password"
        required
      />
      <PasswordField
        label="Neues Passwort"
        name="neues-passwort"
        error={state.errors?.newPassword}
        hint={PASSWORD_HINT}
        autoComplete="new-password"
        required
      />
      <div className="rounded-group bg-surface px-4 breit:border breit:border-line">
        <Toggle label="Andere Geräte abmelden" name="andere-abmelden" value="an" defaultChecked />
      </div>
    </ActionForm>
  )
}
