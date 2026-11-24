'use client'
import { useActionState } from 'react'
import { ActionForm } from '@/shared/ui/ActionForm'
import { Button } from '@/shared/ui/Button'
import { AI_ACTION_IDLE } from '../actions/ai-action-state'
import { saveAiRolesAction } from '../actions/save-ai-roles-action'
import type { RoleOverview } from '../domain/ai-settings-overview'
import { RoleChoiceFields } from './RoleChoiceFields'

type RoleAssignmentFormProps = Readonly<{
  roles: readonly RoleOverview[]
  connections: readonly { id: string; name: string }[]
}>

// Nebenaktion unter „Speichern“: stellt alle Modelle zurück, Verbindung und an/aus bleiben.
const RESET_BUTTON = (
  <Button type="submit" variant="plain" name="aktion" value="zuruecksetzen">
    Auf Empfehlung zurücksetzen
  </Button>
)

// Modell je Foto-Rolle (#108), vorbelegt mit der Empfehlung.
export function RoleAssignmentForm({ roles, connections }: RoleAssignmentFormProps) {
  const [state, formAction, isPending] = useActionState(saveAiRolesAction, AI_ACTION_IDLE)
  return (
    <ActionForm
      action={formAction}
      result={state}
      announcement={null}
      submit={{ label: 'Speichern', isPending, status: state, isInset: true, after: RESET_BUTTON }}
      className="flex flex-col"
    >
      {roles.map((role) => (
        <RoleChoiceFields key={role.role} role={role} connections={connections} />
      ))}
    </ActionForm>
  )
}
