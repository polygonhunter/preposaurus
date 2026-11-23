'use server'
// Fehlerfassung endgültig löschen (#50, VOR-07): nur der Admin, auch bei Direktaufruf. Die
// Oberfläche fragt vorher nach, weil es kein Rückgängig gibt. Übrig gebliebene Fotodateien landen
// im Protokoll, nicht in der Oberfläche.
import { refresh } from 'next/cache'
import { adminAccessMessage } from '@/server/auth/admin-access-message'
import { requireHouseholdAdmin } from '@/server/auth/guards'
import { loadEnv } from '@/shared/config/env'
import { createLogger } from '@/shared/lib/logger'
import { deleteEntry, type DeletedEntry } from '../application/delete-entry'
import { deleteEntryDeps } from '../application/edit-services'
import { deleteEntrySchema } from '../schemas'
import type { ActionFailure } from './action-messages'

export type DeleteEntryActionResult =
  Readonly<{ ok: true; isProductRemoved: boolean }> | ActionFailure

const GONE = 'Das gibt es nicht mehr. Die Seite ist jetzt neu geladen.'

function logLeftovers({ leftoverPhotoIds }: DeletedEntry): void {
  if (leftoverPhotoIds.length === 0) return
  createLogger({ level: loadEnv().LOG_LEVEL }).warn(
    'Fotodateien einer gelöschten Fehlerfassung blieben liegen, das Aufräumen entfernt sie später',
    { photoIds: leftoverPhotoIds },
  )
}

export async function deleteEntryAction(input: unknown): Promise<DeleteEntryActionResult> {
  const admin = await requireHouseholdAdmin()
  if (!admin.ok) return { ok: false, message: adminAccessMessage(admin.error) }
  const parsed = deleteEntrySchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: GONE }
  const result = await deleteEntry(await deleteEntryDeps(), {
    householdId: admin.value.householdId,
    target: parsed.data,
  })
  if (!result.ok) {
    refresh()
    return { ok: false, message: GONE }
  }
  logLeftovers(result.value)
  // Ist das Produkt weg, entscheidet die Oberfläche, wohin es geht: Die Seite gibt es evtl. nicht mehr
  if (!result.value.isProductRemoved) refresh()
  return { ok: true, isProductRemoved: result.value.isProductRemoved }
}
