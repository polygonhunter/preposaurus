import { Group } from '@/shared/ui/Group'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { Row } from '@/shared/ui/Row'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import type { AiSettingsOverview, RoleOverview } from '../domain/ai-settings-overview'
import { ROLE_LABELS, SETUP_STATUS, modelLabel } from './ai-labels'

type AiStatusGroupProps = Readonly<{ overview: AiSettingsOverview }>

function connectionName(overview: AiSettingsOverview, role: RoleOverview): string | undefined {
  const used = role.usedConnection
  if (used === null) return undefined
  if (used.source === 'env') return 'aus der Umgebung'
  return overview.connections.find(({ id }) => id === used.connectionId)?.name
}

function roleValue(role: RoleOverview): string {
  if (role.resolution === 'role-inactive') return 'aus'
  if (role.resolution === 'ready' || role.resolution === 'ai-disabled') {
    return modelLabel(role.model)
  }
  return 'nicht eingerichtet'
}

// Status der Foto-Erkennung (#79): eingerichtet oder nicht und welches Modell jede Rolle nutzt.
// Vom Schlüssel steht hier nichts.
export function AiStatusGroup({ overview }: AiStatusGroupProps) {
  const status = SETUP_STATUS[overview.status]
  return (
    <>
      <GroupHeader id="ki-status">Status</GroupHeader>
      <Group labelledBy="ki-status">
        <Row
          title="Foto-Erkennung"
          trailing={<StatusBadge tone={status.tone} label={status.label} />}
        />
        {overview.roles.map((role) => (
          <Row
            key={role.role}
            title={ROLE_LABELS[role.role]}
            subtitle={connectionName(overview, role)}
            trailing={roleValue(role)}
          />
        ))}
      </Group>
    </>
  )
}
