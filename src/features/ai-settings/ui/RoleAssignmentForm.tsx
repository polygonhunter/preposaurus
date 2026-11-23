'use client'
import { useActionState } from 'react'
import { Button } from '@/shared/ui/Button'
import { SaveStatus } from '@/shared/ui/SaveStatus'
import { AI_ACTION_IDLE } from '../actions/ai-action-state'
import { saveAiRolesAction } from '../actions/save-ai-roles-action'
import type { RoleOverview } from '../domain/ai-settings-overview'
import { RoleChoiceFields } from './RoleChoiceFields'

type RoleAssignmentFormProps = Readonly<{
  roles: readonly RoleOverview[]
  connections: readonly { id: string; name: string }[]
}>

// Modell je Foto-Rolle (#108), vorbelegt mit der Empfehlung. „Auf Empfehlung zurücksetzen“ stellt
// alle Modelle zurück, Verbindung und an/aus bleiben.
export function RoleAssignmentForm({ roles, connections }: RoleAssignmentFormProps) {
  const [state, formAction, isPending] = useActionState(saveAiRolesAction, AI_ACTION_IDLE)
  return (
    <form action={formAction} className="flex flex-col">
      {roles.map((role) => (
        <RoleChoiceFields key={role.role} role={role} connections={connections} />
      ))}
      <div className="mx-4 flex flex-wrap items-center justify-between gap-3 pt-5 breit:mx-6">
        <Button type="submit" variant="plain" name="aktion" value="zuruecksetzen">
          Auf Empfehlung zurücksetzen
        </Button>
        <Button type="submit" variant="tinted" pendingLabel={isPending ? 'Speichert …' : undefined}>
          Speichern
        </Button>
      </div>
      <SaveStatus state={state} />
    </form>
  )
}
