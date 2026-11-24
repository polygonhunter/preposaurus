'use client'
import { useActionState } from 'react'
import { ActionForm } from '@/shared/ui/ActionForm'
import { PasswordField } from '@/shared/ui/PasswordField'
import { AI_ACTION_IDLE } from '../actions/ai-action-state'
import { setUpRecognitionAction } from '../actions/set-up-recognition-action'
import { AnthropicKeyHint } from './AnthropicKeyHint'
import { API_KEY_HINT, API_KEY_LABEL } from './ai-labels'

// Schlüssel im Schritt „Foto-Erkennung einrichten“ der Einrichtung (#314). Dasselbe Passwortfeld
// wie in den Einstellungen; nach dem Speichern führt die Action gleich zum nächsten Schritt.
export function SetupRecognitionForm() {
  const [state, formAction, isPending] = useActionState(setUpRecognitionAction, AI_ACTION_IDLE)
  return (
    <ActionForm
      result={state}
      announcement={state.errors?.apiKey ?? state.message}
      action={formAction}
      submit={{ label: 'Einschalten und weiter', isPending, status: state }}
      className="mx-4 flex flex-col gap-4 breit:mx-6"
    >
      <PasswordField
        label={API_KEY_LABEL}
        name="schluessel"
        error={state.errors?.apiKey}
        hint={API_KEY_HINT}
        autoComplete="off"
        required
      />
      <AnthropicKeyHint />
    </ActionForm>
  )
}
