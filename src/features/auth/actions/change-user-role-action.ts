'use server'
// Rolle setzen (#41), nur der Admin. Der letzte aktive Admin bleibt Admin. Stuft sich ein Admin
// selbst herab, sieht er die Nutzerverwaltung danach nicht mehr und landet bei den Einstellungen.
import { SETTINGS_PATH } from '@/shared/config/settings-paths'
import { readFormText } from '@/shared/lib/form-data'
import { changeUserRole } from '../application/manage-users'
import { roleSchema } from '../schemas'
import { runUserChange } from './run-user-change'
import { failed, type UserActionState } from './user-action-messages'

export async function changeUserRoleAction(
  _previous: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const role = roleSchema.safeParse(readFormText(formData, 'rolle'))
  if (!role.success) return failed('Bitte eine Rolle wählen.')
  return runUserChange(
    formData,
    (deps, { admin, userId }) =>
      changeUserRole(deps, { householdId: admin.householdId, userId, role: role.data }),
    {
      savedMessage: 'Rolle gespeichert.',
      redirectAfter: ({ admin, userId }) =>
        admin.id === userId && role.data !== 'admin' ? SETTINGS_PATH : null,
    },
  )
}
