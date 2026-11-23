// Gemeinsamer Ablauf der kleinen Actions der Nutzerverwaltung (#41): Admin prüfen, Nutzer-ID lesen,
// Use-Case aufrufen, Ergebnis in einen ruhigen Satz übersetzen und die Seite neu laden.
import 'server-only'
import { refresh } from 'next/cache'
import { redirect } from 'next/navigation'
import { adminAccessMessage } from '@/server/auth/admin-access-message'
import { requireHouseholdAdmin, type HouseholdUser } from '@/server/auth/guards'
import { readFormText } from '@/shared/lib/form-data'
import type { Result } from '@/shared/lib/result'
import type { ManageUserError } from '../application/manage-users'
import { userAdminServices, type UserAdminServices } from '../application/user-admin-services'
import { userIdSchema } from '../schemas'
import { USER_GONE, failed, manageErrorMessage, type UserActionState } from './user-action-messages'

type ChangeContext = Readonly<{ admin: HouseholdUser; userId: string }>

type Change = (
  deps: UserAdminServices,
  context: ChangeContext,
) => Promise<Result<null, ManageUserError>>

type ChangeOptions = Readonly<{
  savedMessage: string
  /** Adresse, zu der es nach dem Speichern geht, sonst bleibt die Seite */
  redirectAfter?: (context: ChangeContext) => string | null
}>

export async function runUserChange(
  formData: FormData,
  change: Change,
  { savedMessage, redirectAfter }: ChangeOptions,
): Promise<UserActionState> {
  const admin = await requireHouseholdAdmin()
  if (!admin.ok) return failed(adminAccessMessage(admin.error))
  const userId = userIdSchema.safeParse(readFormText(formData, 'id'))
  if (!userId.success) return failed(USER_GONE)
  const context = { admin: admin.value, userId: userId.data }
  const result = await change(await userAdminServices(), context)
  if (!result.ok) return failed(manageErrorMessage(result.error))
  const target = redirectAfter?.(context) ?? null
  if (target !== null) redirect(target)
  refresh()
  return { status: 'saved', message: savedMessage }
}
