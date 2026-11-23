'use server'
// Tastenkürzel an oder aus (#254, WCAG 2.1.4). Gilt für diesen Browser, siehe shortcut-preference.
import { refresh } from 'next/cache'
import { requireUser } from '@/server/auth/guards'
import { readFormText } from '@/shared/lib/form-data'
import { saveShortcutsEnabled } from '../application/shortcut-preference'
import { SIGNED_OUT, type ProfileActionState } from './profile-action-state'

export async function saveShortcutsAction(
  _previous: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await requireUser()
  if (!user.ok) return { status: 'error', message: SIGNED_OUT }
  await saveShortcutsEnabled(readFormText(formData, 'kuerzel') === 'an')
  refresh()
  return { status: 'saved', message: 'Gespeichert.' }
}
