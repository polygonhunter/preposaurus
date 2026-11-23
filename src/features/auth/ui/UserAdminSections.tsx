import { GroupFooter } from '@/shared/ui/GroupFooter'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { Segmented } from '@/shared/ui/Segmented'
import { changeUserRoleAction } from '../actions/change-user-role-action'
import { endUserSessionsAction } from '../actions/end-user-sessions-action'
import { linkUserMemberAction } from '../actions/link-user-member-action'
import { LAST_ADMIN, OWN_PASSWORD } from '../actions/user-action-messages'
import { MemberChoice, type MemberOption } from './MemberChoice'
import { ResetPasswordForm } from './ResetPasswordForm'
import { UserChangeForm } from './UserChangeForm'
import { UserStatusSection } from './UserStatusSection'
import { ROLE_OPTIONS } from './user-format'

type ManagedUserView = Readonly<{
  id: string
  name: string
  role: 'admin' | 'mitglied'
  isActive: boolean
  memberId: string | null
}>

type UserAdminSectionsProps = Readonly<{
  user: ManagedUserView
  members: readonly MemberOption[]
  isSelf: boolean
  isLastActiveAdmin: boolean
}>

// Was der Admin an einem Nutzer ändert (#41, #123): Rolle, Person, Passwort, Sitzungen, Status.
// Die Regeln prüft der Server, die Seite zeigt nur, was ohnehin nicht geht, gar nicht erst an.
export function UserAdminSections({
  user,
  members,
  isSelf,
  isLastActiveAdmin,
}: UserAdminSectionsProps) {
  return (
    <>
      <GroupHeader id="rolle">Rolle</GroupHeader>
      {isLastActiveAdmin ? (
        <GroupFooter>{LAST_ADMIN}</GroupFooter>
      ) : (
        <UserChangeForm
          action={changeUserRoleAction}
          userId={user.id}
          submitLabel="Rolle speichern"
        >
          <Segmented legend="Rolle" name="rolle" options={ROLE_OPTIONS} defaultValue={user.role} />
        </UserChangeForm>
      )}
      <GroupHeader id="person">Im Haushalt</GroupHeader>
      <UserChangeForm action={linkUserMemberAction} userId={user.id} submitLabel="Speichern">
        <MemberChoice members={members} defaultValue={user.memberId ?? ''} />
      </UserChangeForm>
      <GroupHeader id="passwort">Passwort</GroupHeader>
      {isSelf ? <GroupFooter>{OWN_PASSWORD}</GroupFooter> : <ResetPasswordForm userId={user.id} />}
      <GroupHeader id="geraete">Geräte</GroupHeader>
      <UserChangeForm
        action={endUserSessionsAction}
        userId={user.id}
        submitLabel="Überall abmelden"
      />
      <GroupHeader id="status">Status</GroupHeader>
      <UserStatusSection user={user} isSelf={isSelf} isLastActiveAdmin={isLastActiveAdmin} />
    </>
  )
}
