'use client'
import { useActionState, type ReactNode } from 'react'
import { ActionForm } from '@/shared/ui/ActionForm'
import { USER_ACTION_IDLE, type UserActionState } from '../actions/user-action-messages'

type UserChangeFormProps = Readonly<{
  action: (previous: UserActionState, formData: FormData) => Promise<UserActionState>
  userId: string
  submitLabel: string
  // Weitere Felder über dem Knopf, z. B. Rolle oder Person
  children?: ReactNode
  hiddenFields?: Readonly<Record<string, string>>
}>

// Kleine Änderung an einem Nutzer (#41): Felder, ein Knopf, die Rückmeldung darunter.
export function UserChangeForm({
  action,
  userId,
  submitLabel,
  children,
  hiddenFields = {},
}: UserChangeFormProps) {
  const [state, formAction, isPending] = useActionState(action, USER_ACTION_IDLE)
  return (
    <ActionForm
      action={formAction}
      result={state}
      announcement={null}
      submit={{ label: submitLabel, isPending, status: state }}
      className="mx-4 flex flex-col gap-3 breit:mx-6"
    >
      <input type="hidden" name="id" value={userId} />
      {Object.entries(hiddenFields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {children}
    </ActionForm>
  )
}
