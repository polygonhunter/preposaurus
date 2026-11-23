import { GroupFooter } from '@/shared/ui/GroupFooter'
import { setUserActiveAction } from '../actions/set-user-active-action'
import { LAST_ADMIN } from '../actions/user-action-messages'
import { DeactivateUserButton } from './DeactivateUserButton'
import { UserChangeForm } from './UserChangeForm'

type UserStatusSectionProps = Readonly<{
  user: Readonly<{ id: string; name: string; isActive: boolean }>
  isSelf: boolean
  isLastActiveAdmin: boolean
}>

// Deaktivieren oder wieder aktivieren (EINSTELLUNGEN_NUTZER §3.1). Nicht für sich selbst, nicht für
// den letzten aktiven Admin. Das prüft auch der Server.
export function UserStatusSection({ user, isSelf, isLastActiveAdmin }: UserStatusSectionProps) {
  if (!user.isActive) {
    return (
      <UserChangeForm
        action={setUserActiveAction}
        userId={user.id}
        submitLabel="Wieder aktivieren"
        hiddenFields={{ aktiv: 'ja' }}
      />
    )
  }
  if (isSelf) return <GroupFooter>Dein eigenes Konto deaktiviert ein anderer Admin.</GroupFooter>
  if (isLastActiveAdmin) return <GroupFooter>{LAST_ADMIN}</GroupFooter>
  return <DeactivateUserButton userId={user.id} name={user.name} />
}
