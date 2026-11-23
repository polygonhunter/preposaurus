// Zeilen der Tabelle foto. Die Datei liegt im Foto-Volume, hier steht nur die Referenz.
// Sichtbar ist ein Foto nur im eigenen Haushalt, ein Entwurfsfoto nur dem Nutzer seines Entwurfs.
import 'server-only'
import { and, asc, eq, or } from 'drizzle-orm'
import type { PhotoRole } from '@/shared/config/constants'
import type { Database } from '@/server/db/connection'
import { captureDrafts, photos } from '@/server/db/schema/capture'
import type { DraftOwner } from './draft-repository'

export interface NewDraftPhoto {
  id: string
  householdId: string
  userId: string
  draftId: string
  role: PhotoRole
  path: string
  mimeType: string
}

export async function insertDraftPhoto(db: Database, photo: NewDraftPhoto): Promise<void> {
  await db.insert(photos).values({ ...photo, status: 'entwurf' })
}

export interface DraftPhoto {
  id: string
  householdId: string
  role: PhotoRole
}

const isDraftPhotoOf = (draftId: string) =>
  and(eq(photos.draftId, draftId), eq(photos.status, 'entwurf'))

/** Fotos im Status „entwurf“ eines Entwurfs, älteste zuerst. Feste Fotos gehören zum Produkt. */
export async function listDraftPhotos(db: Database, draftId: string): Promise<DraftPhoto[]> {
  return db
    .select({ id: photos.id, householdId: photos.householdId, role: photos.role })
    .from(photos)
    .where(isDraftPhotoOf(draftId))
    .orderBy(asc(photos.createdAt))
}

/** Foto aus einem Entwurf des Nutzers (für die Erkennung), sonst null. */
export async function findOwnDraftPhoto(
  db: Database,
  owner: DraftOwner,
  photoId: string,
): Promise<DraftPhoto | null> {
  const [row] = await db
    .select({ id: photos.id, householdId: photos.householdId, role: photos.role })
    .from(photos)
    .innerJoin(captureDrafts, eq(captureDrafts.id, photos.draftId))
    .where(
      and(
        eq(photos.id, photoId),
        eq(photos.status, 'entwurf'),
        eq(captureDrafts.householdId, owner.householdId),
        eq(captureDrafts.userId, owner.userId),
      ),
    )
  return row ?? null
}

export async function deleteDraftPhotos(db: Database, draftId: string): Promise<void> {
  await db.delete(photos).where(isDraftPhotoOf(draftId))
}

interface PhotoRef {
  householdId: string
  photoId: string
}

/** Die eine Bedingung „dieses Foto, und es gehört diesem Haushalt“ (#133, #171). */
const isPhotoOfHousehold = ({ householdId, photoId }: PhotoRef) =>
  and(eq(photos.id, photoId), eq(photos.householdId, householdId))

/** Das Foto gehört dem Haushalt, egal in welchem Status (z. B. für ki_aufruf). */
export async function existsPhotoOfHousehold(db: Database, ref: PhotoRef): Promise<boolean> {
  const [row] = await db
    .select({ id: photos.id })
    .from(photos)
    .where(isPhotoOfHousehold(ref))
    .limit(1)
  return row !== undefined
}

export interface VisiblePhoto {
  id: string
  householdId: string
  mimeType: string
}

/**
 * Ein festes Foto sieht der ganze Haushalt, ein Entwurfsfoto nur der Nutzer seines Entwurfs.
 * Ein Entwurfsfoto ohne Entwurf (gerade verworfen) sieht niemand.
 */
export async function findVisiblePhoto(
  db: Database,
  viewer: DraftOwner,
  photoId: string,
): Promise<VisiblePhoto | null> {
  const [row] = await db
    .select({ id: photos.id, householdId: photos.householdId, mimeType: photos.mimeType })
    .from(photos)
    .leftJoin(captureDrafts, eq(captureDrafts.id, photos.draftId))
    .where(
      and(
        isPhotoOfHousehold({ householdId: viewer.householdId, photoId }),
        or(eq(photos.status, 'fest'), eq(captureDrafts.userId, viewer.userId)),
      ),
    )
  return row ?? null
}
