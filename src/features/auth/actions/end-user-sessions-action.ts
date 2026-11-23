'use server'
// „Überall abmelden“ für einen Nutzer (#41, ERS-05), nur der Admin. Für ein verlorenes Gerät.
import { endUserSessions } from '../application/manage-users'
import { runUserChange } from './run-user-change'
import type { UserActionState } from './user-action-messages'

export async function endUserSessionsAction(
  _previous: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  return runUserChange(
    formData,
    (deps, { admin, userId }) => endUserSessions(deps, { householdId: admin.householdId, userId }),
    { savedMessage: 'Auf allen Geräten abgemeldet.' },
  )
}
