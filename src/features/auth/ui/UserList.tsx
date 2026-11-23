import { userPath } from '@/shared/config/settings-paths'
import { Group } from '@/shared/ui/Group'
import { Row } from '@/shared/ui/Row'
import { userSummary } from './user-format'

type UserListItem = Parameters<typeof userSummary>[0] &
  Readonly<{ id: string; name: string; username: string }>

type UserListProps = Readonly<{ users: readonly UserListItem[]; labelledBy: string }>

// Liste der Nutzerverwaltung (#41): Anzeigename, Benutzername, Rolle, Status, letzte Anmeldung.
export function UserList({ users, labelledBy }: UserListProps) {
  return (
    <Group labelledBy={labelledBy}>
      {users.map((user) => (
        <Row
          key={user.id}
          title={`${user.name} (${user.username})`}
          subtitle={userSummary(user)}
          action={{ href: userPath(user.id) }}
        />
      ))}
    </Group>
  )
}
