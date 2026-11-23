import { Group } from '@/shared/ui/Group'
import { Row } from '@/shared/ui/Row'
import { formatSignInTime, ROLE_LABELS } from './user-format'

type UserFactsProps = Readonly<{
  user: Readonly<{
    username: string
    role: 'admin' | 'mitglied'
    isActive: boolean
    lastSignInAt: Date | null
    isPasswordTemporary: boolean
    passwordChangedAt: Date | null
  }>
}>

// Was über einen Nutzer feststeht (EINSTELLUNGEN_NUTZER §3.1, §3.2): Name, Rolle, Status, letzte
// Anmeldung und wann das Passwort zuletzt gesetzt wurde.
export function UserFacts({ user }: UserFactsProps) {
  const password = user.isPasswordTemporary ? 'vorläufig, vom Admin' : 'selbst gesetzt'
  return (
    <Group>
      <Row title="Benutzername" trailing={user.username} />
      <Row title="Rolle" trailing={ROLE_LABELS[user.role]} />
      <Row title="Status" trailing={user.isActive ? 'aktiv' : 'deaktiviert'} />
      <Row title="Letzte Anmeldung" trailing={formatSignInTime(user.lastSignInAt)} />
      <Row
        title="Passwort"
        subtitle={
          user.passwordChangedAt === null
            ? undefined
            : `zuletzt geändert ${formatSignInTime(user.passwordChangedAt)}`
        }
        trailing={password}
      />
    </Group>
  )
}
