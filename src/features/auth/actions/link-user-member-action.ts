'use server'
// Nutzer mit einer Person des Haushalts verknüpfen (#41, HH-06, `linkMemberAction`), nur der Admin.
// Eine Person gehört höchstens zu einem Nutzer: Die alte Verknüpfung löst sich.
import { readFormText } from '@/shared/lib/form-data'
import { linkUserToMember } from '../application/manage-users'
import { linkedMemberSchema } from '../schemas'
import { runUserChange } from './run-user-change'
import { failed, type UserActionState } from './user-action-messages'

export async function linkUserMemberAction(
  _previous: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const memberId = linkedMemberSchema.safeParse(readFormText(formData, 'person'))
  if (!memberId.success) return failed('Diese Person gibt es nicht mehr. Bitte lade die Seite neu.')
  return runUserChange(
    formData,
    (deps, { admin, userId }) =>
      linkUserToMember(deps, { householdId: admin.householdId, userId, memberId: memberId.data }),
    { savedMessage: 'Gespeichert.' },
  )
}
