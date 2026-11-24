'use client'
import { useActionState } from 'react'
import { ActionForm } from '@/shared/ui/ActionForm'
import { Button } from '@/shared/ui/Button'
import { Field } from '@/shared/ui/Field'
import { PasswordField } from '@/shared/ui/PasswordField'
import { SaveStatus } from '@/shared/ui/SaveStatus'
import { addAiConnectionAction } from '../actions/add-ai-connection-action'
import { AI_ACTION_IDLE } from '../actions/ai-action-state'

// Konsole des Anbieters, dort legt man unter „API Keys“ einen Schlüssel an.
const ANTHROPIC_KEYS_URL = 'https://platform.claude.com/settings/keys'

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
        label="API-Schlüssel von Anthropic"
        name="schluessel"
        error={state.errors?.apiKey}
        hint="Beginnt mit „sk-ant-“. Nach dem Speichern zeigt Preposaurus nur noch die letzten vier Zeichen."
        autoComplete="off"
        required
      />
      <p className="px-4 text-footnote text-fg2">
        Einen Schlüssel legt ihr in der{' '}
        <a
          href={ANTHROPIC_KEYS_URL}
          target="_blank"
          rel="noreferrer"
          className="text-accent underline"
        >
          Konsole von Anthropic
        </a>{' '}
        unter „API Keys“ an. Die Abrechnung läuft direkt über euer Konto dort.
      </p>
      <div className="flex items-center justify-between gap-3">
        <SaveStatus state={state} />
        <Button type="submit" variant="tinted" pendingLabel={isPending ? 'Speichert …' : undefined}>
          Hinzufügen
        </Button>
      </div>
    </ActionForm>
  )
}
