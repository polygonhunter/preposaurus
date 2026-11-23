import { memberPath } from '@/shared/config/settings-paths'
import { Group } from '@/shared/ui/Group'
import { Row } from '@/shared/ui/Row'
import type { Diet, Member } from '../domain/member'
import { memberSummary } from './member-labels'

type MemberListProps = Readonly<{
  members: readonly Member[]
  householdDiet: Diet
  labelledBy: string
  /** Nur der Admin öffnet eine Person zum Bearbeiten */
  canEdit: boolean
}>

// Personen des Haushalts (HH-01). Mitglieder sehen dieselbe Liste ohne Links (nur lesen).
export function MemberList({ members, householdDiet, labelledBy, canEdit }: MemberListProps) {
  return (
    <Group labelledBy={labelledBy}>
      {members.map((member) => {
        const subtitle = memberSummary(member, householdDiet)
        const allergies = member.allergies.length > 0 ? member.allergies.join(', ') : undefined
        return (
          <Row
            key={member.id}
            title={member.name}
            subtitle={allergies === undefined ? subtitle : `${subtitle} · ${allergies}`}
            {...(canEdit ? { action: { href: memberPath(member.id) } } : {})}
          />
        )
      })}
    </Group>
  )
}
