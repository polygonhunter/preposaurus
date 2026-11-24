'use client'
import { useActionState } from 'react'
import { ActionForm } from '@/shared/ui/ActionForm'
import { Field } from '@/shared/ui/Field'
import { PasswordField } from '@/shared/ui/PasswordField'
import { addAiConnectionAction } from '../actions/add-ai-connection-action'
import { AI_ACTION_IDLE } from '../actions/ai-action-state'
import { AnthropicKeyHint } from './AnthropicKeyHint'
import { API_KEY_HINT, API_KEY_LABEL } from './ai-labels'

type AddConnectionFormProps = Readonly<{ defaultName: string }>

// Neue Verbindung mit Anthropic-Schlüssel (#108). Das Schlüsselfeld ist ein Passwortfeld, nach dem
// Speichern ist es wieder leer. Der Schlüssel steht danach nur noch verschlüsselt auf dem Server.
export function AddConnectionForm({ defaultName }: AddConnectionFormProps) {
  const [state, formAction, isPending] = useActionState(addAiConnectionAction, AI_ACTION_IDLE)
  return (
    <ActionForm
      result={state}
      announcement={state.errors?.name ?? state.errors?.apiKey}
      action={formAction}
      submit={{ label: 'Hinzufügen', isPending, status: state }}
      className="mx-4 flex flex-col gap-4 breit:mx-6"
    >
      <Field
        label="Name"
        name="name"
        defaultValue={state.name ?? defaultName}
        error={state.errors?.name}
        autoComplete="off"
        required
      />
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
