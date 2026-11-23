'use server'
// Deaktivieren und reaktivieren (#41), nur der Admin. Deaktivieren beendet alle Sitzungen sofort,
// nicht für sich selbst und nicht für den letzten aktiven Admin.
import { readFormText } from '@/shared/lib/form-data'
import { setUserActiveState } from '../application/manage-users'
import { runUserChange } from './run-user-change'
import type { UserActionState } from './user-action-messages'

export async function setUserActiveAction(
  _previous: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const isActive = readFormText(formData, 'aktiv') === 'ja'
  return runUserChange(
    formData,
    (deps, { admin, userId }) =>
      setUserActiveState(deps, {
        householdId: admin.householdId,
        actorId: admin.id,
        userId,
        isActive,
      }),
    { savedMessage: isActive ? 'Wieder aktiv.' : 'Deaktiviert. Alle Sitzungen sind beendet.' },
  )
}
