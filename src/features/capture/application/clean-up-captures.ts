// Aufräumen der Erfassung (#66, UMSETZUNG M6-12, technik.html „Aufräumen“). Aufruf durch den
// Worker (M11-01), einmal am Tag. Drei Schritte, immer erst die DB, dann die Dateien:
// 1. Entwürfe, die seit 7 Tagen niemand angefasst hat, samt ihren Entwurfsfotos.
// 2. Entwurfsfotos ohne Entwurf, falls doch einmal welche entstehen.
// 3. Dateien ohne DB-Zeile, die älter als 24 Stunden sind. Jede Fotozeile belegt zwei Dateien,
//    das Bild (`foto.pfad`) und die Vorschau daneben. Zählte nur der Pfad, wäre jede Vorschau weg.
import 'server-only'
import { deleteOrphanedPhotos } from '@/server/storage/orphaned-photos'
import {
  deleteStaleDrafts,
  listAllPhotos,
  type StalePhoto,
} from '../data/capture-cleanup-repository'
import type { CaptureDeps } from './capture-deps'
import { deletePhotoFiles, photoKeysFor } from './photo-files'

const DAY_MS = 86_400_000
const DRAFT_MAX_AGE_DAYS = 7

export interface CaptureCleanup {
  removedDrafts: number
  removedPhotos: number
  /** Dateien ohne DB-Zeile, die gelöscht wurden */
  removedOrphanFiles: number
}

type CleanupDeps = Pick<CaptureDeps, 'db' | 'storage'>

const keysOf = ({ id, householdId }: StalePhoto) => photoKeysFor({ householdId, photoId: id })

/** Scheitert eine Datei, bleibt sie liegen und fällt beim nächsten Lauf unter Schritt 3. */
async function deleteFilesOf(storage: CleanupDeps['storage'], photos: readonly StalePhoto[]) {
  await Promise.allSettled(photos.map((photo) => deletePhotoFiles(storage, keysOf(photo))))
}

async function referencedKeys(db: CleanupDeps['db']): Promise<Set<string>> {
  const keys = new Set<string>()
  for (const photo of await listAllPhotos(db)) {
    const { full, thumbnail } = keysOf(photo)
    keys.add(full).add(thumbnail)
  }
  return keys
}

export async function cleanUpCaptures(deps: CleanupDeps, now: Date): Promise<CaptureCleanup> {
  const before = new Date(now.getTime() - DRAFT_MAX_AGE_DAYS * DAY_MS)
  const stale = await deleteStaleDrafts(deps.db, before)
  await deleteFilesOf(deps.storage, stale.photos)
  const orphaned = await deleteOrphanedPhotos({
    storage: deps.storage,
    referencedKeys: await referencedKeys(deps.db),
    now,
  })
  return {
    removedDrafts: stale.draftCount,
    removedPhotos: stale.photos.length,
    removedOrphanFiles: orphaned.length,
  }
}
